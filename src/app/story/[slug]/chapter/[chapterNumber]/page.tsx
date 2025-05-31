import { Metadata } from "next"
import { notFound } from "next/navigation"
import { StoryService } from "@/services/story-service"
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

// Generate metadata for SEO
export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  try {
    const { slug, chapterNumber: chapterNumberStr } = await params
    const chapterNumber = Number.parseInt(chapterNumberStr, 10)

    // Fetch story data
    const story = await StoryService.getStoryBySlug(slug)
    if (!story) {
      return {
        title: "Chapter Not Found - FableSpace",
        description: "The chapter you're looking for could not be found."
      }
    }

    // Fetch chapters to find the specific chapter
    const chapters = await StoryService.getChapters(story.id)
    const publishedChapters = chapters.filter(c => c.status === 'published')
    const targetChapter = publishedChapters.find(c => c.number === chapterNumber)

    if (!targetChapter) {
      return {
        title: "Chapter Not Found - FableSpace",
        description: "The chapter you're looking for could not be found."
      }
    }

    // Fetch full chapter details
    const chapter = await StoryService.getChapter(story.id, targetChapter.id)

    return generateChapterMetadata(story, chapter, chapterNumber)
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
    const story = await StoryService.getStoryBySlug(slug)
    if (!story) {
      notFound()
    }

    // Fetch chapters to find the specific chapter
    const chapters = await StoryService.getChapters(story.id)
    const publishedChapters = chapters.filter(c => c.status === 'published')
    const targetChapter = publishedChapters.find(c => c.number === chapterNumber)

    if (!targetChapter) {
      notFound()
    }

    // Fetch full chapter details
    const chapter = await StoryService.getChapter(story.id, targetChapter.id)

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

