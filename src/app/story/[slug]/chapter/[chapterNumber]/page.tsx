import { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchChapterPageData } from "@/lib/server/story-data"
import { generateChapterMetadata, generateChapterStructuredData, generateChapterBreadcrumbStructuredData } from "@/lib/seo/metadata"
import { ChapterPageClient } from "@/features/reader"
import StructuredData from "@/components/seo/structured-data"

interface ChapterPageProps {
  params: Promise<{
    slug: string
    chapterNumber: string
  }>
}

// ISR: Revalidate every 60 seconds for fresh content while maintaining performance
export const revalidate = 60;

// Generate metadata for SEO
export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  try {
    const { slug, chapterNumber: chapterNumberStr } = await params
    const chapterNumber = Number.parseInt(chapterNumberStr, 10)

    const bundle = await fetchChapterPageData(slug, chapterNumber)
    if (!bundle) {
      return {
        title: "Chapter Not Found - FableSpace",
        description: "The chapter you're looking for could not be found."
      }
    }

    return generateChapterMetadata(bundle.story, bundle.chapter as any, chapterNumber)
  } catch (error) {
    return {
      title: "Chapter Not Found - FableSpace",
      description: "The chapter you're looking for could not be found."
    }
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug, chapterNumber: chapterNumberStr } = await params
  const chapterNumber = Number.parseInt(chapterNumberStr, 10)

  const bundle = await fetchChapterPageData(slug, chapterNumber)
  if (!bundle) {
    notFound()
  }

  const { story, chapter, publishedChapters } = bundle

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
}
