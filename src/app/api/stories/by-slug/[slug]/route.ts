import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { calculateStoryStatus } from "@/lib/story-helpers";
import { ViewService } from "@/services/view-service";
import { Chapter, StoryResponse } from "@/types/story";

// GET endpoint to retrieve a story by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
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
            donationsEnabled: true,
            donationMethod: true,
            donationLink: true,
          },
        },
        genre: true,
        language: true,
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
    const storyStatus = calculateStoryStatus(chapters as Chapter[]);

    // Check if the story is a draft and the user is not the author
    if (storyStatus === "draft" && (!session?.user?.id || session.user.id !== story.authorId)) {
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

    // Create a properly formatted story response
    const formattedStory = {
      id: story.id,
      title: story.title,
      slug: story.slug,
      description: story.description || undefined, // Convert null to undefined
      coverImage: story.coverImage || undefined,
      genre: story.genre?.name || undefined,
      language: story.language?.name || 'en',
      isMature: story.isMature,
      status: story.status,
      wordCount: story.wordCount,
      readCount: story.readCount,
      authorId: story.authorId,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,

      // Add author with correct type for donationMethod
      author: story.author ? {
        id: story.author.id,
        name: story.author.name,
        username: story.author.username,
        image: story.author.image,
        donationsEnabled: story.author.donationsEnabled,
        donationMethod: story.author.donationMethod as 'paypal' | 'stripe' | null,
        donationLink: story.author.donationLink,
      } : undefined,

      // Add counts from _count
      likeCount: story._count.likes,
      commentCount: story._count.comments,
      bookmarkCount: story._count.bookmarks,
      chapterCount: story._count.chapters,

      // Add user interaction flags
      isLiked,
      isBookmarked,

      // Add tags
      tags: Array.isArray(story.tags)
        ? story.tags.map(storyTag => storyTag.tag?.name || '').filter(Boolean)
        : [],
    } as StoryResponse & { tags: string[] };

    // Track view if not the author
    if (session?.user?.id !== story.authorId) {
      // Get client IP and user agent for anonymous tracking
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      const userAgent = request.headers.get('user-agent');

      try {
        // Track the view
        const viewResult = await ViewService.trackStoryView(
          story.id,
          session?.user?.id,
          { ip: clientIp || undefined, userAgent: userAgent || undefined }
        );

        // Update the view count in the response if available
        if (viewResult?.viewCount !== undefined) {
          formattedStory.viewCount = viewResult.viewCount;
        }
      } catch (viewError) {
        // Log the error but don't fail the request
        console.error("Error tracking story view:", viewError);
      }
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
