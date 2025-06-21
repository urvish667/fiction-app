import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/auth/db-adapter"
import { StoryService } from "@/services/story-service"
import { ViewService } from "@/services/view-service"
import { calculateStoryStatus } from "@/lib/story-helpers"
import { generateStoryMetadata, generateStoryStructuredData, generateStoryBreadcrumbStructuredData } from "@/lib/seo/metadata"
import StoryPageClient from "@/components/story/story-page-client"
import StructuredData from "@/components/seo/structured-data"

import { logError } from "@/lib/error-logger"
import { StoryResponse, Chapter } from "@/types/story"

interface StoryPageProps {
  params: Promise<{
    slug: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const story = await StoryService.getStoryBySlug(slug)
    if (!story) {
      return {
        title: "Story Not Found - FableSpace",
        description: "The story you're looking for could not be found."
      }
    }

    return generateStoryMetadata(story)
  } catch (error) {
    return {
      title: "Story Not Found - FableSpace",
      description: "The story you're looking for could not be found."
    }
  }
}

export default async function StoryInfoPage({ params }: StoryPageProps) {
  try {
    const { slug } = await params
    const session = await getServerSession(authOptions)

    // Fetch story data directly from database to include session context
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
      notFound()
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
      notFound()
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

    // Get the combined view count
    let viewCount = 0;
    try {
      viewCount = await ViewService.getCombinedViewCount(story.id);
    } catch (viewCountError) {
      logError(viewCountError, { context: 'Getting combined view count', storyId: story.id });
    }

    // Fetch chapters for this story
    const chaptersData = await StoryService.getChapters(story.id)

    // Always filter out draft and scheduled chapters for the public story page
    const publishedChapters = chaptersData.filter(chapter =>
      chapter.status === 'published'
    );

    // Create a properly formatted story response
    const formattedStory: StoryResponse = {
      id: story.id,
      title: story.title,
      slug: story.slug,
      description: story.description || undefined,
      coverImage: story.coverImage || undefined,
      genre: story.genre?.name || undefined,
      language: story.language?.name || 'en',
      isMature: story.isMature,
      status: story.status,
      license: story.license,
      wordCount: publishedChapters.reduce((total, chapter) => total + chapter.wordCount, 0),
      readCount: publishedChapters.reduce((total, chapter) => total + chapter.readCount, 0),
      authorId: story.authorId,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      viewCount,

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

      // Add user interaction flags - THIS IS THE FIX!
      isLiked,
      isBookmarked,
    };

    // Extract tags for structured data - handle nested format from Prisma
    const storyTags = Array.isArray(story.tags)
      ? story.tags.map(storyTag => ({
          id: storyTag.tag?.id || '',
          name: storyTag.tag?.name || ''
        })).filter(tag => tag.name)
      : [];

    // Generate structured data for SEO
    const structuredData = generateStoryStructuredData(formattedStory, storyTags.map(tag => tag.name))
    const breadcrumbData = generateStoryBreadcrumbStructuredData(formattedStory)

    return (
      <>
        {/* Structured Data */}
        <StructuredData data={structuredData} />
        <StructuredData data={breadcrumbData} />

        {/* Client Component */}
        <StoryPageClient
          initialStory={formattedStory}
          initialChapters={publishedChapters}
          initialTags={storyTags}
          slug={slug}
        />
      </>
    )
  } catch (error) {
    console.error('Error loading story page:', error)
    notFound()
  }
}

