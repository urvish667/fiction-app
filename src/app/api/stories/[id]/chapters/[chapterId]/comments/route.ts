import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logger } from "@/lib/logger";
import { withCsrfProtection } from "@/lib/security/csrf";

// Validation schema for creating a comment
const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
  parentId: z.string().optional(),
});

// GET endpoint to retrieve comments for a chapter
export async function GET(
  request: NextRequest,
  context: { params: { id: string; chapterId: string } }
) {
  try {
    // Always await params first
    const params = await context.params;
    const storyId = params.id;
    const chapterId = params.chapterId;

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
    const where: any = {
      storyId,
      chapterId,
      parentId: parentId === "null" ? null : parentId,
    };

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

    // Check if user has liked any of these comments
    let userLikes: Record<string, boolean> = {};

    if (userId) {
      const commentIds = comments.map(comment => comment.id);

      if (commentIds.length > 0) {
        const likes = await prisma.commentLike.findMany({
          where: {
            userId,
            commentId: { in: commentIds },
          },
          select: {
            commentId: true,
          },
        });

        userLikes = likes.reduce((acc, like) => {
          acc[like.commentId] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }
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
    logger.error("Error fetching chapter comments:", { error });
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new comment for a chapter
export const POST = withCsrfProtection(async (request: NextRequest) => {
  try {
    // Extract params from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const storyId = pathParts[3]; // [id] is at index 3 in /api/stories/[id]/chapters/[chapterId]/comments
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // If parentId is provided, verify it exists and belongs to this chapter
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId }
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      // Check if the parent comment belongs to this chapter
      // Using type assertion since we know the schema has chapterId
      const commentWithChapter = parentComment as unknown as { chapterId?: string };
      if (commentWithChapter.chapterId !== chapterId) {
        return NextResponse.json(
          { error: "Parent comment does not belong to this chapter" },
          { status: 400 }
        );
      }
    }

    // Create the comment
    // Using type assertion to handle the chapterId field
    const commentData = {
      content: validatedData.content,
      userId: session.user.id,
      storyId,
      chapterId,
      parentId: validatedData.parentId,
    };

    const comment = await prisma.comment.create({
      data: commentData as any, // Type assertion to bypass TypeScript checking
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
      await prisma.notification.create({
        data: {
          userId: story.authorId,
          type: "chapter_comment",
          title: "New Chapter Comment",
          message: `${session.user.name || session.user.username} commented on chapter "${chapter.title}" of your story "${story.title}"`,
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

    // If this is a reply, also notify the parent comment author
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
        select: { userId: true },
      });

      if (parentComment && parentComment.userId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: parentComment.userId,
            type: "chapter_reply",
            title: "New Reply",
            message: `${session.user.name || session.user.username} replied to your comment on chapter "${chapter.title}"`,
          },
        });

        // Increment unread notifications count
        await prisma.user.update({
          where: { id: parentComment.userId },
          data: {
            unreadNotifications: {
              increment: 1,
            },
          },
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    logger.error("Error creating chapter comment:", { error });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid comment data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
});
