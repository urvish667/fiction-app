import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { logger } from "@/lib/logger";

// Cache control constants
const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_VALUE = 'public, max-age=300, stale-while-revalidate=60'; // 5 minutes cache, 1 minute stale

// Define the params type for route handlers
type StoryRouteParams = { params: Promise<{ id: string }> };

// GET endpoint to retrieve tags for a story
export async function GET(
  request: NextRequest,
  { params }: StoryRouteParams
) {
  try {
    const resolvedParams = await params;
    const storyId = resolvedParams.id;

    // Find the story to verify it exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true }
    });

    if (!story) {
      logger.warn('Attempted to fetch tags for non-existent story', { storyId });
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
      name: storyTag.tag.name,
      slug: storyTag.tag.slug,
    }));

    // Create response with cache headers
    const response = NextResponse.json(tags);
    response.headers.set(CACHE_CONTROL_HEADER, CACHE_VALUE);

    return response;
  } catch (error) {
    // Log the error for server-side debugging
    logger.error('Failed to fetch story tags', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "Failed to fetch story tags" },
      { status: 500 }
    );
  }
}
