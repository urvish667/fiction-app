import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logger } from "@/lib/logger";

/**
 * GET endpoint to retrieve replies for a comment with pagination
 *
 * @param request - The incoming request object
 * @param params - The route parameters containing the comment ID
 * @returns A JSON response with the replies and pagination metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties (Next.js dynamic route params are returned as a Promise)
    const resolvedParams = await params;
    const commentId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Parse and validate query parameters
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
    const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam))) : 10;

    // Calculate pagination offset
    const skip = (page - 1) * limit;

    // Find the comment to ensure it exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      logger.info("Comment not found when fetching replies", { commentId });
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Get replies for the comment and total count in parallel
    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          parentId: commentId,
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
          _count: {
            select: {
              likes: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: {
          parentId: commentId,
        },
      }),
    ]);

    // Get likes for the current user if logged in
    let userLikes: Record<string, boolean> = {};
    if (userId) {
      const replyIds = replies.map(reply => reply.id);

      if (replyIds.length > 0) {
        const likes = await prisma.commentLike.findMany({
          where: {
            userId,
            commentId: { in: replyIds },
          },
          select: {
            commentId: true,
          },
        });

        // Create a map of commentId -> true for liked replies
        userLikes = likes.reduce((acc, like) => {
          acc[like.commentId] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }
    }

    // Transform replies to include like information
    const formattedReplies = replies.map((reply) => ({
      ...reply,
      likeCount: reply._count.likes,
      isLiked: !!userLikes[reply.id],
    }));

    // Add pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      replies: formattedReplies,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    logger.error("Error fetching comment replies", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}
