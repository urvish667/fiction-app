import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { calculateStoryStatus } from "@/lib/story-helpers";
import { Chapter } from "@/types/story";
import { logError } from "@/lib/error-logger";
import { requireCompleteProfile } from "@/lib/auth/auth-utils";

// Define the params type for route handlers
type StoryRouteParams = { params: Promise<{ id: string }> };

// POST endpoint to like a story
export async function POST(
  _request: NextRequest,
  { params }: StoryRouteParams
) {
  try {
    const resolvedParams = await params;
    const storyId = resolvedParams.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user profile is complete
    const profileError = await requireCompleteProfile(session.user.id);
    if (profileError) {
      return NextResponse.json(profileError, { status: 403 });
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

    // Get chapters to determine story status
    const chapters = await prisma.chapter.findMany({
      where: { storyId: story.id },
      select: { status: true }
    });

    // Calculate story status
    const storyStatus = calculateStoryStatus(chapters as unknown as Chapter[]);

    // Check if the story is a draft
    if (storyStatus === "draft") {
      return NextResponse.json(
        { error: "Cannot like a draft story" },
        { status: 400 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        storyId,
        chapterId: null,
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
        storyId: storyId,
      },
    });

    // Create notification for the author (if not self-like)
    if (story.authorId !== session.user.id) {
      const { createStoryLikeNotification } = await import('@/lib/notification-helpers');

      await createStoryLikeNotification({
        recipientId: story.authorId,
        actorId: session.user.id,
        actorUsername: session.user.username || 'Someone',
        storyId: story.id,
        storyTitle: story.title,
        storySlug: story.slug,
      });
    }

    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    logError(error, { context: 'Liking story' });
    return NextResponse.json(
      { error: "Failed to like story" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to unlike a story
export async function DELETE(
  _request: NextRequest,
  { params }: StoryRouteParams
) {
  try {
    const resolvedParams = await params;
    const storyId = resolvedParams.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user profile is complete
    const profileError = await requireCompleteProfile(session.user.id);
    if (profileError) {
      return NextResponse.json(profileError, { status: 403 });
    }

    // Find the like
    const like = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        storyId,
        chapterId: null,
      },
    });

    if (!like) {
      return NextResponse.json(
        { error: "Like not found" },
        { status: 404 }
      );
    }

    // Delete the like
    await prisma.like.deleteMany({
      where: {
        userId: session.user.id,
        storyId,
        chapterId: null,
      },
    });

    return NextResponse.json(
      { message: "Story unliked successfully" },
      { status: 200 }
    );
  } catch (error) {
    logError(error, { context: 'Unliking story' });
    return NextResponse.json(
      { error: "Failed to unlike story" },
      { status: 500 }
    );
  }
}
