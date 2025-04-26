import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { ViewService } from "@/services/view-service";

/**
 * GET endpoint to retrieve most viewed stories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get("limit") || "8");
    const timeRange = searchParams.get("timeRange") || "30days";

    console.log(`Fetching most viewed stories with limit=${limit}, timeRange=${timeRange}`);

    // Get most viewed story IDs using the optimized ViewService
    const mostViewedStoryIds = await ViewService.getMostViewedStories(limit, timeRange);

    console.log(`Found ${mostViewedStoryIds.length} most viewed story IDs:`, mostViewedStoryIds);

    // If no stories found, return empty array
    if (mostViewedStoryIds.length === 0) {
      console.log('No most viewed stories found, returning empty array');
      return NextResponse.json({ stories: [] });
    }

    // Find stories by IDs (for debugging, include all statuses)
    const stories = await prisma.story.findMany({
      where: {
        id: { in: mostViewedStoryIds },
        // Include all stories regardless of status for debugging
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

    console.log(`Returning ${formattedStories.length} formatted stories`);

    return NextResponse.json({
      stories: formattedStories,
      timeRange
    });
  } catch (error) {
    console.error("Error fetching most viewed stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch most viewed stories" },
      { status: 500 }
    );
  }
}
