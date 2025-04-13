import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/auth/db-adapter"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { formatDistanceToNow } from "date-fns"
import { Prisma } from "@prisma/client" // Import Prisma types if needed for JSON

// Define a basic type for expected social links structure
// Adjust this based on the actual expected structure
type ExpectedSocialLinks = {
  twitter?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  // Add other potential keys if necessary
};

// GET method to retrieve user profile by username
export async function GET(
  request: NextRequest,
  context: { params: { username: string } }
) {
  try {
    const params = context.params;
    const username = params.username;
    const session = await getServerSession(authOptions);

    // Fetch user profile by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        location: true,
        website: true,
        socialLinks: true, // Fetch the JSON field
        image: true,
        bannerImage: true,
        createdAt: true,
        preferences: true,
        donationsEnabled: true, // Select donation field
        donationMethod: true,   // Select donation field
        donationLink: true,     // Select donation field
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
    let preferences = { privacySettings: { showLocation: false } };
    if (user.preferences) {
      try {
        preferences = typeof user.preferences === 'string'
          ? JSON.parse(user.preferences)
          : user.preferences as any; // Cast or validate properly
      } catch (error) {
        console.error("Error parsing preferences:", error);
        // Use defaults if parsing fails
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
            
            // Basic check if it looks like our expected structure
            if (tempLinks && typeof tempLinks === 'object' && !Array.isArray(tempLinks)) {
                 // If there was a nested 'set' structure previously, handle it:
                 if ('set' in tempLinks && typeof tempLinks.set === 'object' && tempLinks.set !== null) {
                     parsedSocialLinks = tempLinks.set as ExpectedSocialLinks;
                 } else {
                     parsedSocialLinks = tempLinks as ExpectedSocialLinks;
                 }
            }
        } catch (error) {
            console.error("Error parsing socialLinks:", error);
        }    
    }

    // Format the response
    const formattedUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      location: isCurrentUser || preferences.privacySettings?.showLocation ? user.location : null,
      website: user.website,
      socialLinks: parsedSocialLinks, // Use the safely parsed links
      image: user.image,
      bannerImage: user.bannerImage,
      joinedDate: user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : null,
      storyCount: user.stories.length,
      followers: followerCount,
      following: followingCount,
      isCurrentUser,
      // Include donation fields
      donationsEnabled: user.donationsEnabled,
      donationMethod: user.donationMethod,
      donationLink: user.donationLink,
    };

    return NextResponse.json(formattedUser);

  } catch (error) {
    console.error("Profile retrieval error:", error);
    return NextResponse.json(
      { error: "An error occurred while retrieving the profile" },
      { status: 500 }
    );
  }
}
