import { Metadata } from "next"
import { notFound } from "next/navigation"
import { generateStoryMetadata, generateStoryStructuredData, generateStoryBreadcrumbStructuredData } from "@/lib/seo/metadata"
import StoryPageClient from "@/components/story/story-page-client"
import StructuredData from "@/components/seo/structured-data"
import { fetchStoryData } from "@/lib/server/story-data"

// ISR: Revalidate every 60 seconds for fresh content while maintaining performance
export const revalidate = 60

interface StoryPageProps {
  params: Promise<{
    slug: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  try {
    const { slug } = await params

    // Use the centralized fetchStoryData function for consistent data fetching and caching
    const storyData = await fetchStoryData(slug);

    if (!storyData) {
      return {
        title: "Story Not Found - FableSpace",
        description: "The story you're looking for could not be found."
      }
    }

    // Extract tags from the story data
    const tags = (storyData.tags || []).map(tag => tag.name);

    return generateStoryMetadata(storyData, tags)
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

    // Use the centralized fetchStoryData function with caching and proper data fetching
    const storyData = await fetchStoryData(slug);

    if (!storyData) {
      notFound()
    }

    // Transform ServerStory to StoryResponse format for metadata generation
    const storyForMetadata: any = {
      ...storyData,
      license: 'all-rights-reserved', // Default license
      readCount: storyData.chapters.reduce((total: number, chapter: any) => total + chapter.readCount, 0),
      authorId: storyData.author?.id || '',
    };

    // Generate structured data for SEO
    const structuredData = generateStoryStructuredData(
      storyForMetadata,
      (storyData.tags || []).map(tag => tag.name)
    )
    const breadcrumbData = generateStoryBreadcrumbStructuredData(storyForMetadata)

    return (
      <>
        {/* Structured Data */}
        <StructuredData data={structuredData} />
        <StructuredData data={breadcrumbData} />

        {/* Client Component */}
        <StoryPageClient
          initialStory={storyForMetadata}
          initialChapters={storyData.chapters as any}
          initialTags={storyData.tags || []}
          slug={slug}
        />
      </>
    )
  } catch (error) {
    console.error('Error loading story page:', error)
    notFound()
  }
}
