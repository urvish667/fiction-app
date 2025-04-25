import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Define the params type for route handlers
type UserRouteParams = { params: Promise<{ username: string }> };

// GET endpoint to check if the current user is following a target user
export async function GET(
  request: NextRequest,
  { params }: UserRouteParams
) {
  try {
    const resolvedParams = await params;
    const targetUsername = resolvedParams.username;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { isFollowing: false },
        { status: 200 }
      );
    }

    // Find the target user by username
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if the follow relationship exists
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow }, { status: 200 });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { isFollowing: false, error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}
