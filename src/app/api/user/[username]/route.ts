import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/auth/db-adapter"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { formatDistanceToNow } from "date-fns"

// GET method to retrieve user profile by username
export async function GET(
  request: NextRequest,
  context: { params: { username: string } }
) {
  try {
    const params = await context.params
    const username = params.username
    const session = await getServerSession(authOptions)

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
        socialLinks: true,
        image: true,
        bannerImage: true,
        createdAt: true,
        preferences: true,
        stories: {
          where: {
            status: {
              not: "draft"
            }
          },
          select: {
            id: true,
          }
        },
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Parse preferences
    let preferences = {
      privacySettings: {
        showLocation: false,
      }
    }

    if (user.preferences) {
      try {
        preferences = typeof user.preferences === 'string'
          ? JSON.parse(user.preferences)
          : user.preferences
      } catch (error) {
        console.error("Error parsing preferences:", error)
      }
    }

    // Check if the current user is the profile owner
    const isCurrentUser = session?.user?.id === user.id

    // Get the actual follower and following counts from the database
    const followerCount = user._count.followers
    const followingCount = user._count.following

    // Format the response
    // Parse and normalize socialLinks
    let socialLinksObj = user.socialLinks

    // Handle string format
    if (typeof user.socialLinks === 'string') {
      try {
        socialLinksObj = JSON.parse(user.socialLinks)
      } catch (error) {
        console.error("Error parsing socialLinks:", error)
        socialLinksObj = null
      }
    }

    // Handle nested format with 'set' property
    if (socialLinksObj && typeof socialLinksObj === 'object' && socialLinksObj.set) {
      socialLinksObj = socialLinksObj.set
    }

    console.log('Social links from DB:', user.socialLinks)
    console.log('Normalized social links:', socialLinksObj)

    const formattedUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      // Only include location if user has opted to make it public or if it's the current user
      location: isCurrentUser || preferences.privacySettings?.showLocation ? user.location : null,
      website: user.website,
      socialLinks: socialLinksObj,
      image: user.image,
      bannerImage: user.bannerImage, // Add the banner image field
      joinedDate: user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : null,
      storyCount: user.stories.length,
      followers: followerCount,
      following: followingCount,
      isCurrentUser,
    }

    return NextResponse.json(formattedUser)

  } catch (error) {
    console.error("Profile retrieval error:", error)
    return NextResponse.json(
      { error: "An error occurred while retrieving the profile" },
      { status: 500 }
    )
  }
}
