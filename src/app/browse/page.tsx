import { Metadata } from "next"
import { Suspense } from "react"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import {
  generateBrowseMetadata,
  generateBrowseStructuredData,
  generateCategoryFAQStructuredData,
  generateCategoryWebPageStructuredData
} from "@/lib/seo/metadata"
import BrowseContent from "./browse-content"
import { getAllGenreNames } from "@/lib/seo/genre-descriptions"
import { fetchBrowseStories } from "@/lib/server/browse-data"

// ISR: Revalidate every 5 minutes for browse pages (less frequent updates needed)
export const revalidate = 300

interface BrowsePageProps {
  searchParams: Promise<{
    genre?: string
    tag?: string
    search?: string
    page?: string
    sortBy?: string
    status?: string
    language?: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ searchParams }: BrowsePageProps): Promise<Metadata> {
  const params = await searchParams

  if (params.tag) {
    return generateBrowseMetadata({
      tag: params.tag,
      language: params.language,
      status: params.status,
      page: params.page ? parseInt(params.page) : undefined
    })
  }

  return generateBrowseMetadata({
    genre: params.genre,
    search: params.search,
    language: params.language,
    status: params.status,
    page: params.page ? parseInt(params.page) : undefined
  })
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams

  // Fetch initial data server-side for SEO and Google indexing
  const initialData = await fetchBrowseStories(params)

  let browseStructuredData: ReturnType<typeof generateBrowseStructuredData>
  const additionalStructuredData: (ReturnType<typeof generateCategoryFAQStructuredData> | ReturnType<typeof generateCategoryWebPageStructuredData>)[] = []

  if (params.tag) {
    browseStructuredData = generateBrowseStructuredData({
      tag: params.tag,
      language: params.language,
      status: params.status
    })
    // Optionally, add tag-specific FAQ or WebPage structured data here if desired
  } else {
    browseStructuredData = generateBrowseStructuredData({
      genre: params.genre,
      language: params.language,
      status: params.status
    })

    if (params.genre) {
      // Add FAQ structured data for popular genres
      const allGenres = getAllGenreNames();
      if (allGenres.includes(params.genre)) {
        additionalStructuredData.push(generateCategoryFAQStructuredData(params.genre))
      }

      // Add WebPage structured data for category
      additionalStructuredData.push(generateCategoryWebPageStructuredData({
        genre: params.genre,
        language: params.language
      }))
    }
  }

  return (
    <>
      {/* Main Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(browseStructuredData),
        }}
      />

      {/* Additional Category-specific Structured Data */}
      {additionalStructuredData.map((data, index) => (
        <script
          key={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data),
          }}
        />
      ))}

      <div className="min-h-screen">
        <Navbar />

        <main className="py-8">
          <Suspense fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-xl sm:text-2xl font-semibold mb-6">Browse Stories</p>
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-muted-foreground">Loading stories...</p>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <StoryCardSkeleton key={`skeleton-${index}`} variant="landscape-list" />
                  ))}
                </div>
              </div>
            </div>
          }>
            <BrowseContent initialParams={params} initialData={initialData} />
          </Suspense>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}
