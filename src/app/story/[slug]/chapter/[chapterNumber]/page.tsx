import { Metadata } from "next"
import { notFound } from "next/navigation"
import { StoryService } from "@/lib/api/story"
import { ChapterService } from "@/lib/api/chapter"
import { generateChapterMetadata, generateChapterStructuredData, generateChapterBreadcrumbStructuredData } from "@/lib/seo/metadata"
import ChapterPageClient from "@/components/chapter/chapter-page-client"
import StructuredData from "@/components/seo/structured-data"
import { logger } from "@azure/storage-blob"

interface ChapterPageProps {
  params: Promise<{
    slug: string
    chapterNumber: string
  }>
}

// Force dynamic rendering to prevent caching issues with chapter content
export const dynamic = 'force-dynamic';

// Generate metadata for SEO
export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  try {
    const { slug, chapterNumber: chapterNumberStr } = await params
    const chapterNumber = Number.parseInt(chapterNumberStr, 10)

    // Fetch story data
    const storyResponse = await StoryService.getStoryBySlug(slug)
    if (!storyResponse.success || !storyResponse.data) {
      return {
        title: "Chapter Not Found - FableSpace",
        description: "The chapter you're looking for could not be found."
      }
    }
    const story = storyResponse.data

    // Fetch chapters to find the specific chapter
    const chaptersResponse = await ChapterService.getChapters(story.id)
    if (!chaptersResponse.success || !chaptersResponse.data) {
      return {
        title: "Chapter Not Found - FableSpace",
        description: "The chapter you're looking for could not be found."
      }
    }
    const chapters = chaptersResponse.data
    const publishedChapters = chapters.filter(c => c.status === 'published')
    const targetChapter = publishedChapters.find(c => c.number === chapterNumber)

    if (!targetChapter) {
      return {
        title: "Chapter Not Found - FableSpace",
        description: "The chapter you're looking for could not be found."
      }
    }

    // Use basic chapter info for metadata (avoid duplicate API call that tracks views)
    // The full chapter with content will be fetched in the page component
    return generateChapterMetadata(story, targetChapter as any, chapterNumber)
  } catch (error) {
    return {
      title: "Chapter Not Found - FableSpace",
      description: "The chapter you're looking for could not be found."
    }
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  try {
    const { slug, chapterNumber: chapterNumberStr } = await params
    const chapterNumber = Number.parseInt(chapterNumberStr, 10)

    // Fetch story data
    const storyResponse = await StoryService.getStoryBySlug(slug)
    if (!storyResponse.success || !storyResponse.data) {
      notFound()
    }
    const story = storyResponse.data

    // Fetch chapters to find the specific chapter
    const chaptersResponse = await ChapterService.getChapters(story.id)
    if (!chaptersResponse.success || !chaptersResponse.data) {
      notFound()
    }
    const chapters = chaptersResponse.data
    const publishedChapters = chapters.filter(c => c.status === 'published')
    const targetChapter = publishedChapters.find(c => c.number === chapterNumber)

    if (!targetChapter) {
      notFound()
    }

    // Fetch full chapter details
    const chapterResponse = await ChapterService.getChapter(targetChapter.id)
    if (!chapterResponse.success || !chapterResponse.data) {
      notFound()
    }
    const chapter = chapterResponse.data

    // Check if chapter is published
    if (chapter.status !== 'published') {
      notFound()
    }

    // Generate structured data for SEO
    const structuredData = generateChapterStructuredData(story, chapter, chapterNumber)
    const breadcrumbData = generateChapterBreadcrumbStructuredData(story, chapter, chapterNumber)

    return (
      <>
        {/* Structured Data */}
        <StructuredData data={structuredData} />
        <StructuredData data={breadcrumbData} />

        {/* Client Component */}
        <ChapterPageClient
          initialStory={story}
          initialChapter={chapter}
          initialChapters={publishedChapters}
          slug={slug}
          chapterNumber={chapterNumber}
        />
      </>
    )
  } catch (error) {
    logger.error('Error loading chapter page:', error)
    notFound()
  }
}
