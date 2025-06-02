import { Metadata } from "next"
import { Suspense } from "react"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import AdBanner from "@/components/ad-banner"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import {
  generateBrowseMetadata,
  generateBrowseStructuredData,
  generateCategoryFAQStructuredData,
  generateCategoryWebPageStructuredData
} from "@/lib/seo/metadata"
import BrowseContent from "./browse-content"

interface BrowsePageProps {
  searchParams: Promise<{
    genre?: string
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

  return generateBrowseMetadata({
    genre: params.genre,
    search: params.search,
    language: params.language,
    status: params.status
  })
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams

  // Generate enhanced structured data
  const browseStructuredData = generateBrowseStructuredData({
    genre: params.genre,
    language: params.language,
    status: params.status
  })

  // Generate additional structured data for category pages
  const additionalStructuredData = []

  if (params.genre) {
    // Add FAQ structured data for popular genres
    const popularGenres = ['Fantasy', 'Science Fiction', 'Romance', 'Mystery', 'Horror', 'Young Adult', 'Historical', 'Thriller']
    if (popularGenres.includes(params.genre)) {
      additionalStructuredData.push(generateCategoryFAQStructuredData(params.genre))
    }

    // Add WebPage structured data for category
    additionalStructuredData.push(generateCategoryWebPageStructuredData({
      genre: params.genre,
      language: params.language
    }))
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

      <div className="min-h-screen flex flex-col">
        <Navbar />

        <Suspense fallback={
          <main className="flex-1 container mx-auto px-8 py-8">
            <h1 className="text-3xl font-bold mb-6">Browse Stories</h1>
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground">Loading stories...</p>
              </div>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <StoryCardSkeleton key={`skeleton-${index}`} viewMode="grid" />
                ))}
              </div>
            </div>
          </main>
        }>
          <BrowseContent initialParams={params} />
        </Suspense>

        {/* Fixed Bottom Banner Ad */}
        <div className="sticky bottom-0 w-full z-40">
          <AdBanner type="banner" className="w-full h-16" />
        </div>

        <SiteFooter />
      </div>
    </>
  )
}

