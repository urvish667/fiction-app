import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET endpoint to retrieve replies for a comment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const commentId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Find the comment to ensure it exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Get replies for the comment
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

    // Transform replies to include like information
    const formattedReplies = replies.map((reply) => ({
      ...reply,
      likeCount: reply._count.likes,
      isLiked: !!userLikes[reply.id],
      _count: undefined,
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
    console.error("Error fetching replies:", error);
    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}
