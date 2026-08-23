import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar, SiteFooter } from "@/components/layout";
import { generateUserProfileMetadata, generateUserProfileStructuredData } from "@/lib/seo/metadata";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { UserService } from "@/lib/api/user";
import {
  ProfileHeader,
  UserProfileClient,
  type UserProfile,
  type ExpectedSocialLinks,
} from "@/features/user-profile";

// ISR: Revalidate every 2 minutes for user profiles
export const revalidate = 120;

type UserPageParams = { params: Promise<{ username: string }> };

async function getUserData(username: string): Promise<UserProfile | null> {
  try {
    const response = await UserService.getUserProfile(username);

    if (!response.success || !response.data) {
      return null;
    }

    const user = response.data;

    const preferences = {
      privacySettings: {
        publicProfile: user.preferences?.privacySettings?.publicProfile || false,
        showEmail: user.preferences?.privacySettings?.showEmail || false,
        showLocation: user.preferences?.privacySettings?.showLocation || false,
        allowMessages: user.preferences?.privacySettings?.allowMessages || false,
        forum: user.preferences?.privacySettings?.forum || false,
      },
    };

    let parsedSocialLinks: ExpectedSocialLinks | null = null;
    if (user.socialLinks) {
      parsedSocialLinks = user.socialLinks;
    }

    let formattedJoinedDate = null;
    if (user.createdAt) {
      try {
        const joinedDate = new Date(user.createdAt);
        formattedJoinedDate = formatDistanceToNow(joinedDate, { addSuffix: true });
      } catch {
        formattedJoinedDate = user.createdAt;
      }
    }

    return {
      id: user.id,
      username: user.username || "",
      name: user.name,
      bio: user.bio,
      location: preferences.privacySettings?.showLocation ? user.location : null,
      email: preferences.privacySettings?.showEmail ? user.email : null,
      website: user.website,
      socialLinks: parsedSocialLinks,
      image: user.image,
      bannerImage: user.bannerImage,
      joinedDate: formattedJoinedDate,
      storyCount: user.storyCount || 0,
      followers: (user as any).followerCount || user.followers || 0,
      following: (user as any).followingCount || user.following || 0,
      donationsEnabled: user.donationsEnabled,
      donationMethod: user.donationMethod,
      donationLink: user.donationLink,
      isCurrentUser: false,
      preferences: preferences,
      isPublic: preferences.privacySettings?.publicProfile || false,
    } as UserProfile;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

export async function generateMetadata({ params }: UserPageParams): Promise<Metadata> {
  const resolvedParams = await params;
  const user = await getUserData(resolvedParams.username);

  if (!user) {
    return {
      title: "User Not Found - FableSpace",
      description: "The requested user profile could not be found on FableSpace.",
    };
  }

  return generateUserProfileMetadata({
    username: user.username,
    name: user.name,
    bio: user.bio,
    storyCount: user.storyCount,
    image: user.image,
    location: user.location,
  });
}

export default async function UserProfilePage({ params }: UserPageParams) {
  const resolvedParams = await params;
  const user = await getUserData(resolvedParams.username);

  if (!user) {
    notFound();
  }

  const userProfileStructuredData = generateUserProfileStructuredData({
    username: user.username,
    name: user.name,
    bio: user.bio,
    storyCount: user.storyCount,
    image: user.image,
    location: user.location,
    website: user.website,
    joinedDate: user.joinedDate,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(userProfileStructuredData),
        }}
      />

      <div className="min-h-screen">
        <Navbar />

        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProfileHeader user={user} />
            <UserProfileClient user={user} />
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
