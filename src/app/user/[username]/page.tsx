import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  MapPin,
  LinkIcon,
  Mail,
} from "lucide-react"
import { TwitterIcon, FacebookIcon, InstagramIcon } from "@/components/social-icons"
import ProfileActionButtons from "@/components/profile-action-buttons"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { generateUserProfileMetadata, generateUserProfileStructuredData } from "@/lib/seo/metadata"
import { prisma } from "@/lib/auth/db-adapter"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { formatDistanceToNow } from "date-fns"
import { notFound } from "next/navigation"
import UserProfileClient from "./user-profile-client"

// Define user profile type
type UserProfile = {
  id: string
  name: string | null
  username: string // We ensure this is not null in getUserData
  bio: string | null
  location: string | null
  website: string | null
  socialLinks: {
    twitter?: string | null
    facebook?: string | null
    instagram?: string | null
  } | null
  image: string | null
  bannerImage: string | null
  joinedDate: string | null
  storyCount: number
  isCurrentUser: boolean
  followers?: number
  following?: number
  donationsEnabled?: boolean | null;
  donationMethod?: string | null;
  donationLink?: string | null;
  preferences?: {
    privacySettings?: {
      showLocation?: boolean
      showEmail?: boolean
    }
  }
  isPublic: boolean
  email: string | null
}

// Define a basic type for expected social links structure
type ExpectedSocialLinks = {
  twitter?: string | null;
  facebook?: string | null;
  instagram?: string | null;
};

// Define the params type for the page
type UserPageParams = { params: Promise<{ username: string }> };

// Server-side function to fetch user data
async function getUserData(username: string): Promise<UserProfile | null> {
  try {
    const session = await getServerSession(authOptions);

    // Try to find user by username or ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { id: username }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        location: true,
        website: true,
        socialLinks: true,
        image: true,
        bannerImage: true,
        createdAt: true,
        preferences: true,
        donationsEnabled: true,
        donationMethod: true,
        donationLink: true,
        stories: {
          where: {
            status: { not: "draft" }
          },
          select: { id: true }
        },
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user || !user.username) {
      return null;
    }

    // Parse preferences safely
    let preferences = {
      privacySettings: {
        publicProfile: false,
        showEmail: false,
        showLocation: false,
        allowMessages: false
      }
    };

    if (user.preferences) {
      try {
        preferences = typeof user.preferences === 'string'
          ? JSON.parse(user.preferences)
          : user.preferences;
      } catch (error) {
        // Silently fall back to default preferences if parsing fails
      }
    }

    // Check if the current user is the profile owner
    const isCurrentUser = session?.user?.id === user.id;

    // Get follower/following counts
    const followerCount = user._count.followers;
    const followingCount = user._count.following;

    // Safely parse and normalize socialLinks
    let parsedSocialLinks: ExpectedSocialLinks | null = null;
    if (user.socialLinks) {
      try {
        let tempLinks = typeof user.socialLinks === 'string'
          ? JSON.parse(user.socialLinks)
          : user.socialLinks;

        if (tempLinks && typeof tempLinks === 'object' && !Array.isArray(tempLinks)) {
          if ('set' in tempLinks && typeof tempLinks.set === 'object' && tempLinks.set !== null) {
            parsedSocialLinks = tempLinks.set as ExpectedSocialLinks;
          } else {
            parsedSocialLinks = tempLinks as ExpectedSocialLinks;
          }
        }
      } catch (error) {
        // Silently fall back to null if parsing fails
      }
    }

    // Format the response with privacy checks
    return {
      id: user.id,
      username: user.username, // We already checked this is not null above
      name: user.name,
      bio: user.bio,
      location: preferences.privacySettings?.showLocation ? user.location : null,
      email: preferences.privacySettings?.showEmail ? user.email : null,
      website: user.website,
      socialLinks: parsedSocialLinks,
      image: user.image,
      bannerImage: user.bannerImage,
      joinedDate: user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : null,
      storyCount: user.stories.length,
      followers: followerCount,
      following: followingCount,
      donationsEnabled: user.donationsEnabled,
      donationMethod: user.donationMethod,
      donationLink: user.donationLink,
      isCurrentUser,
      preferences: preferences,
      isPublic: preferences.privacySettings?.publicProfile || false
    } as UserProfile;

  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: UserPageParams): Promise<Metadata> {
  const resolvedParams = await params;
  const user = await getUserData(resolvedParams.username);

  if (!user) {
    return {
      title: 'User Not Found - FableSpace',
      description: 'The requested user profile could not be found on FableSpace.',
    };
  }

  return generateUserProfileMetadata({
    username: user.username,
    name: user.name,
    bio: user.bio,
    storyCount: user.storyCount,
    image: user.image,
    location: user.location
  });
}

export default async function UserProfilePage({ params }: UserPageParams) {
  const resolvedParams = await params;
  const user = await getUserData(resolvedParams.username);

  if (!user) {
    notFound();
  }

  // Generate structured data for SEO
  const userProfileStructuredData = generateUserProfileStructuredData({
    username: user.username,
    name: user.name,
    bio: user.bio,
    storyCount: user.storyCount,
    image: user.image,
    location: user.location,
    website: user.website,
    joinedDate: user.joinedDate
  });

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(userProfileStructuredData),
        }}
      />

      <div className="min-h-screen">
        <Navbar />

        <main className="container mx-auto px-4 md:px-8 py-4 md:py-8">
          <div className="mb-4 md:mb-8">
            <div className="relative h-32 sm:h-48 md:h-64 w-full rounded-lg overflow-hidden mb-8 sm:mb-12 md:mb-16">
              {user.bannerImage ? (
                <>
                  <img
                    src={user.bannerImage}
                    alt="Profile banner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </>
              ) : (
                <img
                  src="/placeholder.svg"
                  alt="Profile banner"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Avatar positioned to overlap the banner */}
            <div className="relative -mt-20 sm:-mt-28 md:-mt-36 ml-2 sm:ml-4 md:ml-8 flex items-end justify-between">
              <Avatar className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 border-2 sm:border-4 border-background shadow-lg">
                <AvatarImage src={user.image || "/placeholder-user.jpg"} alt={user.name || user.username} />
                <AvatarFallback>{(user.name || user.username).charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-2 pb-2 sm:pb-4 pr-2 sm:pr-4">
                <ProfileActionButtons
                  username={user.username}
                  isCurrentUser={user.isCurrentUser}
                  author={{
                    id: user.id,
                    name: user.name || user.username,
                    donationMethod: user.donationMethod as 'PAYPAL' | 'STRIPE' | 'BMC' | 'KOFI' | null,
                    donationLink: user.donationLink || null,
                  }}
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end pl-2 sm:pl-4 md:pl-40">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{user.name || user.username}</h1>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">@{user.username}</p>

                <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 text-xs sm:text-sm text-muted-foreground">
                  {user.email && user.preferences?.privacySettings?.showEmail && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="break-all">{user.email}</span>
                    </div>
                  )}

                  {user.location && user.preferences?.privacySettings?.showLocation && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}

                  {user.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary break-all">
                        {user.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}

                  {user.joinedDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Joined {user.joinedDate}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex gap-2 mt-4">
                  {user.socialLinks && (
                    <>
                      {/* Check for Twitter link */}
                      {(() => {
                        const twitterLink = typeof user.socialLinks === 'object' && user.socialLinks.twitter ?
                          user.socialLinks.twitter : null;

                        return twitterLink ? (
                          <a href={twitterLink} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost">
                              <TwitterIcon className="h-4 w-4" />
                              <span className="sr-only">Twitter</span>
                            </Button>
                          </a>
                        ) : null;
                      })()}

                      {/* Check for Facebook link */}
                      {(() => {
                        const facebookLink = typeof user.socialLinks === 'object' && user.socialLinks.facebook ?
                          user.socialLinks.facebook : null;

                        return facebookLink ? (
                          <a href={facebookLink} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost">
                              <FacebookIcon className="h-4 w-4" />
                              <span className="sr-only">Facebook</span>
                            </Button>
                          </a>
                        ) : null;
                      })()}

                      {/* Check for Instagram link */}
                      {(() => {
                        const instagramLink = typeof user.socialLinks === 'object' && user.socialLinks.instagram ?
                          user.socialLinks.instagram : null;

                        return instagramLink ? (
                          <a href={instagramLink} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost">
                              <InstagramIcon className="h-4 w-4" />
                              <span className="sr-only">Instagram</span>
                            </Button>
                          </a>
                        ) : null;
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="mt-4 pl-2 sm:pl-4 md:pl-40">
                <p className="text-sm md:text-base max-w-2xl leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 pl-2 sm:pl-4 md:pl-40 flex flex-wrap gap-4 sm:gap-6 text-sm">
              <div>
                <span className="font-bold">{user.storyCount}</span> Stories
              </div>
              <Link href="#followers" className="hover:text-primary">
                <span className="font-bold">{user.followers || 0}</span> Followers
              </Link>
              <Link href="#following" className="hover:text-primary">
                <span className="font-bold">{user.following || 0}</span> Following
              </Link>
            </div>
          </div>

          {/* Client-side interactive tabs */}
          <UserProfileClient user={user} />
        </main>

        {/* Footer */}
        <SiteFooter />
      </div>
    </>
  );
}
