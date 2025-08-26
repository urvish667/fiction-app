import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { generateHomepageMetadata, generateHomepageStructuredData, generateOrganizationStructuredData } from "@/lib/seo/metadata"
import MostViewedStories from "@/components/most-viewed-stories"

function slugify(text:String) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // remove punctuation
    .replace(/\s+/g, '-')      // replace spaces with -
    .replace(/-+/g, '-');      // collapse multiple dashes
}

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

      <main className="min-h-screen">
        <Navbar />

        {/* Hero Section */}
        <section className="relative py-20 md:py-28 lg:py-36 px-8 overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Unleash Your Stories, One Page at a Time
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join our community of writers and readers to discover, create, and share captivating stories.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/browse">
                  <Button size="lg" className="text-base">
                    Start Reading
                  </Button>
                </Link>
                <Link href="/write/story-info">
                  <Button size="lg" variant="outline" className="text-base border-2 border-primary">
                    Start Writing
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Abstract background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"></div>
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-3xl"></div>
          </div>
        </section>

        {/* Most Viewed Stories Section */}
        <MostViewedStories />

        {/* Explore Categories Section */}
        <section className="py-16 px-8 bg-muted/50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-10">Explore Categories</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/browse?genre=${encodeURIComponent(slugify(category))}`}
                  passHref
                >
                  <Button variant="secondary" className="rounded-full">
                    {category}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>



        {/* Featured On Section */}
        {/* <FeaturedOn /> */}

        {/* Footer */}
        <SiteFooter />
      </main>
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
