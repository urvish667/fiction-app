import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import {
  generateHomepageMetadata,
  generateHomepageStructuredData,
  generateOrganizationStructuredData,
  generateHomepageFAQStructuredData,
} from "@/lib/seo/metadata"
import MostViewedStories from "@/components/most-viewed-stories"
import NewlyArrivedStories from "@/components/newly-arrived-stories"
import ContinueReading from "@/components/continue-reading"
import { slugify } from "@/lib/utils"

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageMetadata()
}


export default function Home() {
  const homepageStructuredData = generateHomepageStructuredData()
  const organizationStructuredData = generateOrganizationStructuredData()
  const faqStructuredData = generateHomepageFAQStructuredData()

  return (
    <>
      {/* Structured Data — WebSite, Organization, FAQPage */}
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

      <div>
        <main className="flex-1">
          {/* Hero Section — full viewport height, image starts from very top */}
          <section className="relative h-screen min-h-[600px] overflow-hidden flex items-center">
            {/* Full-bleed background image */}
            <Image
              src="/hero-image.png"
              alt="FableSpace hero — a world of stories"
              fill
              priority
              className="object-cover object-center"
            />

            {/* Navbar floated over the image */}
            <div className="absolute top-0 left-0 w-full z-50">
              <Navbar />
            </div>

            {/* Dark gradient overlay — fades from left to transparent */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

            {/* Left-aligned content — pt-20 clears the navbar */}
            <div className="relative z-10 container mx-auto px-6 md:px-12 pt-20">
              <div className="max-w-xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold tracking-tight mb-5 leading-tight text-white">
                  Every Story Opens a New World
                </h1>
                <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed">
                  Discover your next obsession or create a world of your own.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/browse">
                    <Button size="lg" className="text-base px-8 py-3 h-auto rounded-full shadow-lg hover:shadow-xl transition-all">
                      Start Reading
                    </Button>
                  </Link>
                  <Link href="/write/story-info">
                    <Button size="lg" variant="outline" className="text-base px-8 py-3 h-auto rounded-full border-2 border-white bg-transparent text-white hover:bg-white hover:text-black transition-all">
                      Start Writing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <div className="container mx-auto px-4 py-12 space-y-8">
            {/* Home Page Sections */}
            <NewlyArrivedStories />
            <MostViewedStories />
            <ContinueReading />

            {/* Explore Categories Section */}
            <section className="bg-muted/30 rounded-3xl p-8 md:p-12">
              <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl font-bold mb-8">Explore Categories</h2>
                <div className="flex flex-wrap gap-3 justify-center">
                  {categories.map((category: string) => (
                    <Button key={category} variant="secondary" className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
                      <Link href={`/browse?genre=${encodeURIComponent(slugify(category))}`}>
                        {category}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Footer */}
        <SiteFooter />
      </div>
    </>
  )
}


const categories = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Horror",
  "Historical",
  "Adventure",
  "Young Adult",
  "Drama",
  "Comedy",
  "Non-Fiction",
  "Memoir",
  "Biography",
  "Self-Help",
  "Children",
  "Crime",
  "Poetry",
  "LGBTQ+",
  "Short Story",
  "Urban",
  "Paranormal",
  "Dystopian",
  "Slice of Life",
  "Fanfiction",
]
