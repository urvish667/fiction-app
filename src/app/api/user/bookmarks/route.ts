import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET endpoint to retrieve bookmarked stories for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userId = searchParams.get("userId") || session.user.id;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Check if the requested user is the current user or if we're viewing someone else's profile
    const isCurrentUser = userId === session.user.id;

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

    // Format the response
    const stories = bookmarks.map((bookmark) => {
      const story = bookmark.story;
      return {
        ...story,
        likeCount: story._count.likes,
        commentCount: story._count.comments,
        bookmarkCount: story._count.bookmarks,
        chapterCount: story._count.chapters,
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
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while fetching bookmarked stories" },
      { status: 500 }
    );
  }
}
