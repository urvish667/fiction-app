import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET endpoint to retrieve followers for a user
export async function GET(
  request: NextRequest,
  context: { params: { username: string } }
) {
  try {
    const params = await context.params;
    const username = params.username;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Find followers
    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: {
          followingId: user.id
        },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              bio: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.follow.count({
        where: {
          followingId: user.id
        }
      })
    ]);
    
    // Format the response
    const formattedFollowers = followers.map(follow => ({
      id: follow.follower.id,
      name: follow.follower.name,
      username: follow.follower.username,
      image: follow.follower.image,
      bio: follow.follower.bio,
      followedAt: follow.createdAt
    }));
    
    // Return the followers with pagination info
    return NextResponse.json({
      followers: formattedFollowers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
