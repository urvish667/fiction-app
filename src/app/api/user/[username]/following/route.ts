import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET endpoint to retrieve users that a user is following
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
    
    // Find following
    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: {
          followerId: user.id
        },
        include: {
          following: {
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
          followerId: user.id
        }
      })
    ]);
    
    // Format the response
    const formattedFollowing = following.map(follow => ({
      id: follow.following.id,
      name: follow.following.name,
      username: follow.following.username,
      image: follow.following.image,
      bio: follow.following.bio,
      followedAt: follow.createdAt
    }));
    
    // Return the following with pagination info
    return NextResponse.json({
      following: formattedFollowing,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}
