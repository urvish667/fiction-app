import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getBatchCombinedStoryViewCounts } from "@/lib/redis/view-tracking";

// GET endpoint to retrieve bookmarked stories for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);

    const userIdFromQuery = searchParams.get("userId");
    const userId = userIdFromQuery || session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not provided" },
        { status: 400 }
      );
    }

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Find bookmarked stories
    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: {
          userId,
        },
        include: {
          story: {
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
              language: true,
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  bookmarks: true,
                  chapters: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.bookmark.count({
        where: {
          userId,
        },
      }),
    ]);

    // Get combined view counts (story + all chapters) for bookmarked stories
    const storyIds = bookmarks.map(b => b.story.id);
    const viewCountMap = await getBatchCombinedStoryViewCounts(storyIds);

    // Format the response
    const stories = bookmarks.map((bookmark) => {
      const story = bookmark.story;
      return {
        ...story,
        likeCount: story._count.likes,
        commentCount: story._count.comments,
        bookmarkCount: story._count.bookmarks,
        chapterCount: story._count.chapters,
        viewCount: viewCountMap.get(story.id) || 0,
        isBookmarked: true,
        _count: undefined,
      };
    });

    // Return the stories with pagination info
    return NextResponse.json({
      stories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "An error occurred while fetching bookmarked stories" },
      { status: 500 }
    );
  }
}
