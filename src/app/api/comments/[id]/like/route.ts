import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST endpoint to like a comment
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const commentId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        story: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "Comment already liked" },
        { status: 400 }
      );
    }

    // Create the like
    const like = await prisma.commentLike.create({
      data: {
        userId: session.user.id,
        commentId,
      },
    });

    // Get the updated like count
    const likeCount = await prisma.commentLike.count({
      where: { commentId },
    });

    // Create notification for the comment author (if not self-like)
    if (comment.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: comment.userId,
          type: "comment_like",
          title: "New Like",
          message: `${session.user.name || session.user.username} liked your comment`,
        },
      });

      // Increment unread notifications count
      await prisma.user.update({
        where: { id: comment.userId },
        data: {
          unreadNotifications: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({ like, likeCount }, { status: 201 });
  } catch (error) {
    console.error("Error liking comment:", error);
    return NextResponse.json(
      { error: "Failed to like comment" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to unlike a comment
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const commentId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the like
    const like = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId,
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
    await prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId,
        },
      },
    });

    // Get the updated like count
    const likeCount = await prisma.commentLike.count({
      where: { commentId },
    });

    return NextResponse.json({ likeCount }, { status: 200 });
  } catch (error) {
    console.error("Error unliking comment:", error);
    return NextResponse.json(
      { error: "Failed to unlike comment" },
      { status: 500 }
    );
  }
}
