import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/auth/db-adapter"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { formatDistanceToNow } from "date-fns"

// Define a basic type for expected social links structure
type ExpectedSocialLinks = {
  twitter?: string | null;
  facebook?: string | null;
  instagram?: string | null;
};

// Define the params type for route handlers
type UserRouteParams = { params: Promise<{ username: string }> };

// GET method to retrieve user profile by username
export async function GET(
  request: NextRequest,
  { params }: UserRouteParams
) {
  try {
    const resolvedParams = await params;
    const identifier = resolvedParams.username;
    const session = await getServerSession(authOptions);

    // Try to find user by username or ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { id: identifier }
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
        const tempLinks = typeof user.socialLinks === 'string'
          ? JSON.parse(user.socialLinks)
          : user.socialLinks;

        if (tempLinks && typeof tempLinks === 'object' && !Array.isArray(tempLinks)) {
          if ('set' in tempLinks && typeof tempLinks.set === 'object' && tempLinks.set !== null) {
            parsedSocialLinks = tempLinks.set as ExpectedSocialLinks;
          } else {
            parsedSocialLinks = tempLinks as ExpectedSocialLinks;
          }
        }
      } catch {
        // Silently fall back to null if parsing fails
      }
    }

    // Format the response with privacy checks
    const formattedUser = {
      id: user.id,
      username: user.username,
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
      preferences: preferences
    };

    return NextResponse.json(formattedUser);

  } catch {
    return NextResponse.json(
      { error: "An error occurred while retrieving the profile" },
      { status: 500 }
    );
  }
}
