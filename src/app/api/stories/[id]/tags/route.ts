import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";

// GET endpoint to retrieve tags for a story
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const storyId = params.id;

    // Find the story to verify it exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Get all tags for the story
    const storyTags = await prisma.storyTag.findMany({
      where: { storyId },
      include: {
        tag: true,
      },
    });

    // Extract just the tag names
    const tags = storyTags.map(storyTag => ({
      id: storyTag.tag.id,
      name: storyTag.tag.name
    }));

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching story tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch story tags" },
      { status: 500 }
    );
  }
}
