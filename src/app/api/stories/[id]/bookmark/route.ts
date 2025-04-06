import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST endpoint to bookmark a story
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const storyId = params.id;

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

    // Check if the story is a draft
    if (story.isDraft && story.authorId !== session.user.id) {
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
    console.error("Error bookmarking story:", error);
    return NextResponse.json(
      { error: "Failed to bookmark story" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a bookmark
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const storyId = params.id;

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
    console.error("Error removing bookmark:", error);
    return NextResponse.json(
      { error: "Failed to remove bookmark" },
      { status: 500 }
    );
  }
}

