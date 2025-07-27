import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { calculateStoryStatus } from "@/lib/story-helpers";
import { ViewService } from "@/services/view-service";
import { Chapter, StoryResponse } from "@/types/story";
import { logError } from "@/lib/error-logger";

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
        prisma.like.findFirst({
          where: {
            userId: session.user.id,
            storyId: story.id,
            chapterId: null,
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

    // Get the combined view count before formatting the response
    let viewCount = 0;
    try {
      viewCount = await ViewService.getCombinedViewCount(story.id);
    } catch (viewCountError) {
      logError(viewCountError, { context: 'Getting combined view count', storyId: story.id });
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
      viewCount, // Set the view count from the combined count

      // Add author with correct type for donationMethod
      author: story.author ? {
        id: story.author.id,
        name: story.author.name,
        username: story.author.username,
        image: story.author.image,
        donationsEnabled: story.author.donationsEnabled,
        donationMethod: story.author.donationMethod as 'PAYPAL' | 'STRIPE' | null,
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

      // Add tags - return as objects with id and name for consistency
      tags: Array.isArray(story.tags)
        ? story.tags.map(storyTag => ({
            id: storyTag.tag?.id || '',
            name: storyTag.tag?.name || ''
          })).filter(tag => tag.name)
        : [],
    } as StoryResponse & { tags: { id: string; name: string }[] };

    // Track view if not the author
    if (session?.user?.id !== story.authorId) {
      // Get client IP and user agent for anonymous tracking
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'Unknown';
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
        logError(viewError, { context: 'Tracking story view', storyId: story.id, userId: session?.user?.id });
      }
    }

    return NextResponse.json(formattedStory);
  } catch (error) {
    logError(error, { context: 'Fetching story by slug' });
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}
