import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logger } from "@/lib/logger";

// POST endpoint to like a comment
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let commentId = 'unknown';
  try {
    const resolvedParams = await params;
    commentId = resolvedParams.id;

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

    // Use a transaction for creating like, updating count, and creating notification
    const [like, likeCount] = await prisma.$transaction(async (tx) => {
      // Create the like
      const newLike = await tx.commentLike.create({
        data: {
          userId: session.user.id,
          commentId,
        },
      });

      // Get the updated like count
      const updatedLikeCount = await tx.commentLike.count({
        where: { commentId },
      });

      // Create notification for the comment author (if not self-like)
      if (comment.userId !== session.user.id) {
        const { createCommentLikeNotification } = await import('@/lib/notification-helpers');

        await createCommentLikeNotification({
          recipientId: comment.userId,
          actorId: session.user.id,
          actorUsername: session.user.username || 'Someone',
          commentId: comment.id,
          comment: comment.content,
          storyId: comment.storyId,
          storyTitle: comment.story.title,
          storySlug: comment.story.slug,
        });
      }

      return [newLike, updatedLikeCount];
    });

    return NextResponse.json({ like, likeCount }, { status: 201 });
  } catch (error) {
    logger.error(`Error liking comment: ${error instanceof Error ? error.message : String(error)}`, { commentId });
    return NextResponse.json(
      { error: "Failed to like comment", details: process.env.NODE_ENV === "development" ? String(error) : undefined },
      { status: 500 }
    );
  }
}

// DELETE endpoint to unlike a comment
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let commentId = 'unknown';
  try {
    const resolvedParams = await params;
    commentId = resolvedParams.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Use a transaction for deleting like and updating count
    const likeCount = await prisma.$transaction(async (tx) => {
      // Find and delete the like
      const like = await tx.commentLike.findUnique({
        where: {
          userId_commentId: {
            userId: session.user.id,
            commentId,
          },
        },
      });

      if (!like) {
        throw new Error("Like not found");
      }

      await tx.commentLike.delete({
        where: {
          userId_commentId: {
            userId: session.user.id,
            commentId,
          },
        },
      });

      // Get the updated like count
      return await tx.commentLike.count({
        where: { commentId },
      });
    }).catch(error => {
      if (error.message === "Like not found") {
        return null;
      }
      throw error;
    });

    if (likeCount === null) {
      return NextResponse.json(
        { error: "Like not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ likeCount }, { status: 200 });
  } catch (error) {
    logger.error(`Error unliking comment: ${error instanceof Error ? error.message : String(error)}`, { commentId });
    return NextResponse.json(
      { error: "Failed to unlike comment", details: process.env.NODE_ENV === "development" ? String(error) : undefined },
      { status: 500 }
    );
  }
}
