import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST endpoint to like a story
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const storyId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Check if the story is a draft
    if (story.isDraft) {
      return NextResponse.json(
        { error: "Cannot like a draft story" },
        { status: 400 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "Story already liked" },
        { status: 400 }
      );
    }

    // Create the like
    const like = await prisma.like.create({
      data: {
        userId: session.user.id,
        storyId,
      },
    });

    // Create notification for the author (if not self-like)
    if (story.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: story.authorId,
          type: "like",
          title: "New Like",
          message: `${session.user.name || session.user.username} liked your story "${story.title}"`,
        },
      });

      // Increment unread notifications count
      await prisma.user.update({
        where: { id: story.authorId },
        data: {
          unreadNotifications: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    console.error("Error liking story:", error);
    return NextResponse.json(
      { error: "Failed to like story" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to unlike a story
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const storyId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the like
    const like = await prisma.like.findUnique({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId,
        },
      },
    });

    if (!like) {
      return NextResponse.json(
        { error: "Like not found" },
        { status: 404 }
      );
    }

    // Delete the like
    await prisma.like.delete({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId,
        },
      },
    });

    return NextResponse.json(
      { message: "Story unliked successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error unliking story:", error);
    return NextResponse.json(
      { error: "Failed to unlike story" },
      { status: 500 }
    );
  }
}
