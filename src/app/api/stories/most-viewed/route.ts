import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";

/**
 * GET endpoint to retrieve most viewed stories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get("limit") || "8");

    // Find stories sorted by readCount
    const stories = await prisma.story.findMany({
      where: {
        status: "published",
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
            views: true
          },
        },
      },
      orderBy: {
        readCount: 'desc'
      },
      take: limit,
    });

    // Transform stories to include counts and format tags
    const formattedStories = stories.map((story) => {
      // Extract tags safely
      const tags = Array.isArray(story.tags)
        ? story.tags.map(storyTag => storyTag.tag?.name || '').filter(Boolean)
        : [];

      return {
        ...story,
        tags,
        likeCount: story._count.likes,
        commentCount: story._count.comments,
        bookmarkCount: story._count.bookmarks,
        chapterCount: story._count.chapters,
        viewCount: story._count.views,
        _count: undefined,
      };
    });

    return NextResponse.json({
      stories: formattedStories
    });
  } catch (error) {
    console.error("Error fetching most viewed stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch most viewed stories" },
      { status: 500 }
    );
  }
}
