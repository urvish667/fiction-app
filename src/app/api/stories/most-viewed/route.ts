import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { ViewService } from "@/services/view-service";
import { logger } from "@/lib/logger";

// Cache control constants
const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_VALUE = 'public, max-age=300, stale-while-revalidate=60'; // 5 minutes cache, 1 minute stale

/**
 * GET endpoint to retrieve most viewed stories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get("limit") || "8");
    const timeRange = searchParams.get("timeRange") || "30days";

    logger.debug('Fetching most viewed stories', { limit, timeRange });

    // Get most viewed story IDs using the optimized ViewService
    const mostViewedStoryIds = await ViewService.getMostViewedStories(limit, timeRange);

    logger.debug('Found most viewed story IDs', {
      count: mostViewedStoryIds.length,
      ids: mostViewedStoryIds
    });

    // If no stories found, return empty array
    if (mostViewedStoryIds.length === 0) {
      logger.info('No most viewed stories found for the given time range', { timeRange });

      // Create response with cache headers
      const response = NextResponse.json({ stories: [] });
      response.headers.set(CACHE_CONTROL_HEADER, CACHE_VALUE);

      return response;
    }

    // Find stories by IDs
    const stories = await prisma.story.findMany({
      where: {
        id: { in: mostViewedStoryIds },
        status: { not: 'draft' } // Only include published stories
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        genre: true,
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
            chapters: true,
          },
        },
      },
    });

    // Get combined view counts (story + chapter views) for these stories
    const viewCountMap = await ViewService.getBatchCombinedViewCounts(
      mostViewedStoryIds,
      timeRange
    );

    // Sort stories by view count (descending)
    const sortedStories = [...stories].sort((a, b) => {
      const viewsA = viewCountMap.get(a.id) || 0;
      const viewsB = viewCountMap.get(b.id) || 0;
      return viewsB - viewsA;
    });

    // Transform stories to include counts and format tags
    const formattedStories = sortedStories.map((story) => {
      // Extract tags safely
      const tags = Array.isArray(story.tags)
        ? story.tags.map(storyTag => storyTag.tag?.name || '').filter(Boolean)
        : [];

      // Get view count from our map
      const viewCount = viewCountMap.get(story.id) || 0;

      return {
        ...story,
        tags,
        likeCount: story._count.likes,
        commentCount: story._count.comments,
        bookmarkCount: story._count.bookmarks,
        chapterCount: story._count.chapters,
        viewCount,
        _count: undefined,
      };
    });

    logger.debug('Returning formatted stories', { count: formattedStories.length });

    // Create response with cache headers
    const response = NextResponse.json({
      stories: formattedStories,
      timeRange
    });
    response.headers.set(CACHE_CONTROL_HEADER, CACHE_VALUE);

    return response;
  } catch (error) {
    // Log the error for server-side debugging
    logger.error('Failed to fetch most viewed stories', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "Failed to fetch most viewed stories" },
      { status: 500 }
    );
  }
}
