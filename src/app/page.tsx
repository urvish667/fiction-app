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

        {/* Join Community Section */}
        <section className="py-20 px-8 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Community</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with thousands of writers and readers, get feedback on your work, and discover new stories every
              day.
            </p>
            <div className="flex justify-center">
              <Link href="https://discord.gg/JVMr2TRXY7" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="text-base flex items-center justify-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Join Discord
                </Button>
              </Link>
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
