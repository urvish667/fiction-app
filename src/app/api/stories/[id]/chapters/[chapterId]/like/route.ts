import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logger } from "@/lib/logger";
import { withCsrfProtection } from "@/lib/security/csrf";

// Define the params type for route handlers
type ChapterRouteParams = { params: { id: string; chapterId: string } };

// POST endpoint to like a chapter
export const POST = withCsrfProtection(async (
  request: NextRequest
) => {
  try {
    // Extract params from the URL since context is not passed by withCsrfProtection
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const storyId = pathParts[3]; // [id] is at index 3
    const chapterId = pathParts[5]; // [chapterId] is at index 5

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the story and chapter
    const [story, chapter] = await Promise.all([
      prisma.story.findUnique({
        where: { id: storyId },
      }),
      prisma.chapter.findUnique({
        where: { id: chapterId },
      }),
    ]);

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Verify chapter belongs to story
    if (chapter.storyId !== storyId) {
      return NextResponse.json(
        { error: "Chapter does not belong to this story" },
        { status: 400 }
      );
    }

    // Check if the chapter is published
    if (chapter.status !== "published") {
      return NextResponse.json(
        { error: "Cannot like an unpublished chapter" },
        { status: 400 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        storyId,
        chapterId,
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "Chapter already liked" },
        { status: 400 }
      );
    }

    // Create the like
    let like;
    try {
      like = await prisma.like.create({
        data: {
          userId: session.user.id,
          storyId,
          chapterId,
        },
      });
    } catch (error) {
      // Type guard to safely access error properties
      const err = error as Error & { code?: string };

      logger.error("Error creating like:", {
        error: err,
        errorCode: err.code,
        errorMessage: err.message,
        userId: session.user.id,
        storyId,
        chapterId
      });

      // Check if it's a unique constraint violation
      if (err.code === 'P2002') {
        return NextResponse.json(
          { error: "Chapter already liked" },
          { status: 400 }
        );
      }

      // Return a proper error response instead of throwing
      return NextResponse.json(
        { error: "Failed to create like", details: err.message },
        { status: 500 }
      );
    }

    // Create notification for the author (if not self-like)
    if (story.authorId !== session.user.id) {
      const { createChapterLikeNotification } = await import('@/lib/notification-helpers');

      await createChapterLikeNotification({
        recipientId: story.authorId,
        actorId: session.user.id,
        actorUsername: session.user.username || 'Someone',
        storyId: story.id,
        storyTitle: story.title,
        storySlug: story.slug,
        chapterId: chapter.id,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
      });
    }

    // Get the total like count for this chapter
    const likeCount = await prisma.like.count({
      where: {
        chapterId,
      },
    });

    return NextResponse.json({ like, likeCount }, { status: 201 });
  } catch (caughtError) {
    // Type guard to safely access error properties
    const error = caughtError as Error;

    // Variables might not be defined in the catch block scope
    // Use safe defaults for logging
    let errorStoryId = 'unknown';
    let errorChapterId = 'unknown';
    let userId = 'unauthenticated';

    try {
      // Try to extract params from the URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      errorStoryId = pathParts[3] || 'unknown'; // [id] is at index 3
      errorChapterId = pathParts[5] || 'unknown'; // [chapterId] is at index 5
    } catch (paramError) {
      // Ignore errors when trying to extract params
    }

    logger.error("Error liking chapter:", {
      error,
      storyId: errorStoryId,
      chapterId: errorChapterId,
      userId,
      errorMessage: error.message,
      errorStack: error.stack
    });

    // Ensure we always return a valid JSON response
    return NextResponse.json(
      {
        error: "Failed to like chapter",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
});

// DELETE endpoint to unlike a chapter
export const DELETE = withCsrfProtection(async (
  request: NextRequest
) => {
  try {
    // Extract params from the URL since context is not passed by withCsrfProtection
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const storyId = pathParts[3]; // [id] is at index 3
    const chapterId = pathParts[5]; // [chapterId] is at index 5

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the like
    const like = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        storyId,
        chapterId,
      },
    });

    if (!like) {
      return NextResponse.json(
        { error: "Like not found" },
        { status: 404 }
      );
    }

    // Delete the like
    try {
      await prisma.like.deleteMany({
        where: {
          userId: session.user.id,
          storyId,
          chapterId,
        },
      });
    } catch (error) {
      // Type guard to safely access error properties
      const deleteError = error as Error;

      logger.error("Error deleting like:", {
        error: deleteError,
        userId: session.user.id,
        storyId,
        chapterId
      });

      return NextResponse.json(
        { error: "Failed to delete like", details: deleteError.message },
        { status: 500 }
      );
    }

    // Get the updated like count
    const likeCount = await prisma.like.count({
      where: {
        chapterId,
      },
    });

    return NextResponse.json({ likeCount }, { status: 200 });
  } catch (caughtError) {
    // Type guard to safely access error properties
    const error = caughtError as Error;

    // Variables might not be defined in the catch block scope
    // Use safe defaults for logging
    let errorStoryId = 'unknown';
    let errorChapterId = 'unknown';
    let userId = 'unauthenticated';

    try {
      // Try to extract params from the URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      errorStoryId = pathParts[3] || 'unknown'; // [id] is at index 3
      errorChapterId = pathParts[5] || 'unknown'; // [chapterId] is at index 5
    } catch (paramError) {
      // Ignore errors when trying to extract params
    }

    logger.error("Error unliking chapter:", {
      error,
      storyId: errorStoryId,
      chapterId: errorChapterId,
      userId,
      errorMessage: error.message,
      errorStack: error.stack
    });

    // Ensure we always return a valid JSON response
    return NextResponse.json(
      {
        error: "Failed to unlike chapter",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
});
