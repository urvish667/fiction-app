import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logger } from "@/lib/logger";

// GET endpoint to check if a chapter is liked by the current user
// Note: GET requests don't need CSRF protection, but we're keeping the pattern consistent
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    // Always await params first
    const params = await context.params;
    const storyId = params.id;
    const chapterId = params.chapterId;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ isLiked: false }, { status: 200 });
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

    // Check if the user has liked this chapter
    const like = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        storyId,
        chapterId,
      },
    });

    return NextResponse.json({ isLiked: !!like }, { status: 200 });
  } catch (error) {
    logger.error("Error checking chapter like status:", { error });
    return NextResponse.json(
      { error: "Failed to check like status", isLiked: false },
      { status: 500 }
    );
  }
}
