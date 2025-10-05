import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logError } from "@/lib/error-logger";
import { requireCompleteProfile } from "@/lib/auth/auth-utils";

// Validation schema for creating a comment
const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
  parentId: z.string().optional(),
});

// GET endpoint to retrieve comments for a story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const storyId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const parentId = searchParams.get("parentId") || null;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {
      storyId,
      parentId: parentId === "null" ? null : parentId,
      chapterId: null, // Only get story-level comments
    } as const;

    // Execute query with count
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          _count: {
            select: {
              replies: true,
              likes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    // Get likes for the current user if logged in
    let userLikes: Record<string, boolean> = {};
    if (userId) {
      const commentIds = comments.map(comment => comment.id);
      const likes = await prisma.commentLike.findMany({
        where: {
          userId,
          commentId: { in: commentIds },
        },
        select: {
          commentId: true,
        },
      });

      // Create a map of commentId -> true for liked comments
      userLikes = likes.reduce((acc, like) => {
        acc[like.commentId] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    // Transform comments to include counts and like status
    const formattedComments = comments.map((comment) => ({
      ...comment,
      replyCount: comment._count.replies,
      likeCount: comment._count.likes,
      isLiked: !!userLikes[comment.id],
      _count: undefined,
    }));

    // Add pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      comments: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    logError(error, { context: 'Fetching comments' });
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // If this is a reply, check if parent comment exists
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      // Ensure parent comment belongs to the same story
      if (parentComment.storyId !== storyId) {
        return NextResponse.json(
          { error: "Parent comment does not belong to this story" },
          { status: 400 }
        );
      }

      // Ensure we're not replying to a reply (only one level of nesting)
      if (parentComment.parentId) {
        return NextResponse.json(
          { error: "Cannot reply to a reply" },
          { status: 400 }
        );
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        userId: session.user.id,
        storyId,
        parentId: validatedData.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    // Create notification for the story author (if not self-comment)
    if (story.authorId !== session.user.id) {
      const { createStoryCommentNotification } = await import('@/lib/notification-helpers');

      await createStoryCommentNotification({
        recipientId: story.authorId,
        actorId: session.user.id,
        actorUsername: session.user.username || 'Someone',
        storyId: story.id,
        storyTitle: story.title,
        storySlug: story.slug,
        commentId: comment.id,
        comment: validatedData.content,
      });
    }

    // If this is a reply, also notify the parent comment author
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
        select: { userId: true },
      });

      if (parentComment && parentComment.userId !== session.user.id) {
        const { createReplyNotification } = await import('@/lib/notification-helpers');

        await createReplyNotification({
          recipientId: parentComment.userId,
          actorId: session.user.id,
          actorUsername: session.user.username || 'Someone',
          commentId: comment.id,
          comment: validatedData.content,
          storyId: story.id,
          storyTitle: story.title,
          storySlug: story.slug,
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    logError(error, { context: 'Creating comment' });
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
