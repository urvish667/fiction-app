import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { generateHomepageMetadata, generateHomepageStructuredData, generateOrganizationStructuredData } from "@/lib/seo/metadata"
import MostViewedStories from "@/components/most-viewed-stories"
import { slugify } from "@/lib/utils"

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageMetadata()
}

export default function Home() {
  const homepageStructuredData = generateHomepageStructuredData()
  const organizationStructuredData = generateOrganizationStructuredData()

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homepageStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />

      <div className="min-h-screen">
        <Navbar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="container mx-auto px-4 text-center relative z-10">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 leading-tight">
                  Unleash Your Stories,<br />One Page at a Time
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                  Join our community of writers and readers to discover, create, and share captivating stories.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/browse">
                    <Button size="lg" className="text-base px-8 py-3 h-auto rounded-full shadow-lg hover:shadow-xl transition-all">
                      Start Reading
                    </Button>
                  </Link>
                  <Link href="/write/story-info">
                    <Button size="lg" variant="outline" className="text-base px-8 py-3 h-auto rounded-full border-2 border-primary/20 hover:bg-primary/5 transition-all">
                      Start Writing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Abstract background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"></div>
              <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-secondary/10 blur-3xl"></div>
            </div>
          </section>

          <div className="container mx-auto px-4 py-12 space-y-16">
            {/* Most Viewed Stories Section */}
            <MostViewedStories />

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

            {/* Featured On Section */}
            {/* <FeaturedOn /> */}
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
  "Fanfiction"
]
