import { Metadata } from "next"
import { notFound } from "next/navigation"
import { StoryService } from "@/services/story-service"
import { generateStoryMetadata, generateStoryStructuredData, generateStoryBreadcrumbStructuredData } from "@/lib/seo/metadata"
import StoryPageClient from "@/components/story/story-page-client"
import StructuredData from "@/components/seo/structured-data"

interface StoryPageProps {
  params: {
    slug: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  try {
    const story = await StoryService.getStoryBySlug(params.slug)
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
    // Fetch story data
    const story = await StoryService.getStoryBySlug(params.slug)

    if (!story) {
      notFound()
    }

    // Fetch chapters for this story
    const chaptersData = await StoryService.getChapters(story.id)

    // Always filter out draft and scheduled chapters for the public story page
    const publishedChapters = chaptersData.filter(chapter =>
      chapter.status === 'published'
    );

    // Fetch tags for this story
    let storyTags: { id: string; name: string }[] = []
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stories/${story.id}/tags`)
      if (response.ok) {
        const tagsData = await response.json()
        if (Array.isArray(tagsData)) {
          storyTags = tagsData
        }
      }
    } catch (err) {
      console.error('Error fetching story tags:', err)
    }

    // Generate structured data for SEO
    const structuredData = generateStoryStructuredData(story, storyTags.map(tag => tag.name))
    const breadcrumbData = generateStoryBreadcrumbStructuredData(story)

    return (
      <>
        {/* Structured Data */}
        <StructuredData data={structuredData} />
        <StructuredData data={breadcrumbData} />

        {/* Client Component */}
        <StoryPageClient
          initialStory={story}
          initialChapters={publishedChapters}
          initialTags={storyTags}
          slug={params.slug}
        />
      </>
    )
  } catch (error) {
    console.error('Error loading story page:', error)
    notFound()
  }
}

