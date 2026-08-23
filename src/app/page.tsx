import { Metadata } from "next"
import { SiteFooter } from "@/components/layout"
import {
  generateHomepageMetadata,
  generateHomepageStructuredData,
  generateOrganizationStructuredData,
  generateHomepageFAQStructuredData,
} from "@/lib/seo/metadata"
import {
  HeroSection,
  NewlyArrivedStories,
  MostViewedStories,
  ContinueReading,
  ExploreCategoriesSection,
  AuthorEmpowermentSection,
  HomeFaqSection,
} from "@/features/home"
import { StoryService } from "@/lib/api/story"
import { ImageService } from "@/lib/api/images"

export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageMetadata()
}

export default async function Home() {
  const homepageStructuredData = generateHomepageStructuredData()
  const organizationStructuredData = generateOrganizationStructuredData()
  const faqStructuredData = generateHomepageFAQStructuredData()

  // Fetch both story sections in parallel server-side — zero client API calls on home load
  const [newestRes, mostViewedRes] = await Promise.all([
    StoryService.getStories({ sortBy: 'newest', limit: 8 }).catch(() => null),
    StoryService.getStories({ sortBy: 'mostViewed', limit: 8 }).catch(() => null),
  ])

  const formatStories = (res: typeof newestRes) =>
    (res?.data?.stories || []).map((s: any) => ({
      ...s,
      author: s.author?.name || s.author?.username || "Unknown Author",
      coverImage: ImageService.getImageUrl(s.coverImage) || "/placeholder.svg",
      viewCount: s.viewCount || s.readCount || 0,
    }))

  const newestStories = formatStories(newestRes)
  const mostViewedStories = formatStories(mostViewedRes)

  return (
    <>
      {/* ── Structured Data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      {/* ── Google Fonts for hero only ── */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Alegreya+Sans:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div>
        <main className="flex-1">
          {/* Hero Section */}
          <HeroSection />

          <div className="container mx-auto px-4 py-12 space-y-8">
            <NewlyArrivedStories initialData={newestStories} />
            <MostViewedStories initialData={mostViewedStories} />
            <ContinueReading />
            <ExploreCategoriesSection />
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}
