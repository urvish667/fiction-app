import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logError } from "@/lib/error-logger";

// Define the params type for route handlers
type UserRouteParams = { params: Promise<{ username: string }> };

// POST endpoint to follow a user
export async function POST(
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
        { error: "Unauthorized" },
        { status: 401 }
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

    // Prevent following yourself
    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }

    // Create the follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUser.id,
      },
    });

    // Create notification for the target user
    const { createFollowNotification } = await import('@/lib/notification-helpers');

    await createFollowNotification({
      recipientId: targetUser.id,
      actorId: session.user.id,
      actorUsername: session.user.username || 'Someone',
    });

    return NextResponse.json(follow, { status: 201 });
  } catch (error) {
    logError(error, { context: 'Following user' });
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to unfollow a user
export async function DELETE(
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
        { error: "Unauthorized" },
        { status: 401 }
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

    // Find the follow relationship
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      },
    });

    if (!follow) {
      return NextResponse.json(
        { error: "Not following this user" },
        { status: 404 }
      );
    }

    // Delete the follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logError(error, { context: 'Unfollowing user' });
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
