import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET endpoint to retrieve a story by slug
export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  const params = await context.params;
  try {
    const slug = params.slug;
    const session = await getServerSession(authOptions);

    // Find the story by slug
    const story = await prisma.story.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
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

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Check if the story is a draft and the user is not the author
    if (story.isDraft && (!session?.user?.id || session.user.id !== story.authorId)) {
      return NextResponse.json(
        { error: "Unauthorized - This story is not published" },
        { status: 403 }
      );
    }

    // Check if the user has liked or bookmarked this story
    let isLiked = false;
    let isBookmarked = false;

    if (session?.user?.id) {
      const [like, bookmark] = await Promise.all([
        prisma.like.findUnique({
          where: {
            userId_storyId: {
              userId: session.user.id,
              storyId: story.id,
            },
          },
        }),
        prisma.bookmark.findUnique({
          where: {
            userId_storyId: {
              userId: session.user.id,
              storyId: story.id,
            },
          },
        }),
      ]);

      isLiked = !!like;
      isBookmarked = !!bookmark;
    }

    // Format the response
    const formattedStory = {
      ...story,
      likeCount: story._count.likes,
      commentCount: story._count.comments,
      bookmarkCount: story._count.bookmarks,
      chapterCount: story._count.chapters,
      isLiked,
      isBookmarked,
      _count: undefined,
    };

    // Increment read count if not the author
    if (session?.user?.id !== story.authorId) {
      await prisma.story.update({
        where: { id: story.id },
        data: { readCount: { increment: 1 } },
      });
    }

    return NextResponse.json(formattedStory);
  } catch (error) {
    console.error("Error fetching story by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}
