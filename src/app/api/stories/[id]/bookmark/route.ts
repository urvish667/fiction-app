import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { calculateStoryStatus } from "@/lib/story-helpers";
import { Chapter } from "@/types/story";
import { logError } from "@/lib/error-logger";

// Define the params type for route handlers
type RouteParams = { params: Promise<{ id: string }> };

// POST endpoint to bookmark a story
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
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

    // Check if the story is a draft and the user is not the author
    if (storyStatus === "draft" && story.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Cannot bookmark a draft story" },
        { status: 400 }
      );
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId,
        },
      },
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: "Story already bookmarked" },
        { status: 400 }
      );
    }

    // Create the bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        storyId,
      },
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    logError(error, { context: 'Bookmarking story' });
    return NextResponse.json(
      { error: "Failed to bookmark story" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a bookmark
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
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

    // Find the bookmark
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId,
        },
      },
    });

    if (!bookmark) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }

    // Delete the bookmark
    await prisma.bookmark.delete({
      where: {
        userId_storyId: {
          userId: session.user.id,
          storyId,
        },
      },
    });

    return NextResponse.json(
      { message: "Bookmark removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    logError(error, { context: 'Removing bookmark' });
    return NextResponse.json(
      { error: "Failed to remove bookmark" },
      { status: 500 }
    );
  }
}

