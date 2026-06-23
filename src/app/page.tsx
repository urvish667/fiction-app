import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { BookOpen, PenLine, Heart, Sparkles } from "lucide-react"

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageMetadata()
}

// Answer-first FAQ data — mirrors the FAQPage JSON-LD exactly for GEO consistency
const homepageFAQs = [
  {
    question: "What is FableSpace?",
    answer:
      "FableSpace is a free creative fiction platform where independent writers publish original stories and readers discover immersive worlds. Genres include fantasy, romance, science fiction, mystery, thriller, and 20+ more — all free, no subscription required.",
  },
  {
    question: "Can I publish stories for free?",
    answer:
      "Yes. Publishing is 100% free. Create an account, use the chapter editor, and publish instantly. No listing fees, no subscription, no limits on story length or chapter count.",
  },
  {
    question: "Do writers keep all their earnings?",
    answer:
      "Yes. Writers receive 100% of reader donations through Buy Me a Coffee and Ko-fi. FableSpace takes zero cut. We sustain the platform through ads so creators keep everything readers give them.",
  },
  {
    question: "Is it free to read stories?",
    answer:
      "Yes. Every story on FableSpace is completely free to read. There are no paywalls, premium tiers, or required accounts to browse and read any chapter.",
  },
  {
    question: "What genres are available?",
    answer:
      "FableSpace hosts 25+ genres: Fantasy, Romance, Science Fiction, Mystery, Thriller, Horror, Historical, Adventure, Young Adult, Drama, Comedy, Poetry, LGBTQ+, Fanfiction, Dystopian, Paranormal, Slice of Life, and more.",
  },
]

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

          {/* Answer-First TL;DR — What is FableSpace (GEO: entity description) */}
          <section
            aria-label="About FableSpace"
            className="border-b border-border/50 bg-background"
          >
            <div className="container mx-auto px-4 py-10 md:py-14">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-xl md:text-2xl font-semibold mb-6 text-center">
                  What is FableSpace?
                </h2>
                <p className="text-muted-foreground text-base md:text-lg text-center leading-relaxed mb-8 max-w-2xl mx-auto">
                  FableSpace is a <strong>free fiction platform</strong> for independent writers and readers.
                  Writers publish original stories — chapter by chapter — across 25+ genres.
                  Readers discover them for free. Writers keep <strong>100% of reader donations</strong>.
                  No fees. No paywalls. No algorithms burying your work.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tldrPoints.map((point) => (
                    <div
                      key={point.label}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/40 text-center"
                    >
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <point.Icon className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-sm">{point.label}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{point.description}</p>
                    </div>
                  ))}
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

            {/* Common Questions — GEO: FAQPage visible content */}
            <section
              id="faq"
              aria-label="Frequently asked questions about FableSpace"
              className="max-w-3xl mx-auto py-4"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
                Common Questions
              </h2>
              <Accordion type="single" collapsible className="w-full space-y-2">
                {homepageFAQs.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                    className="border border-border/60 rounded-xl px-4 data-[state=open]:bg-muted/30 transition-colors"
                  >
                    <AccordionTrigger className="text-left font-medium text-base py-4 hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <p className="text-center text-sm text-muted-foreground mt-6">
                More questions?{" "}
                <Link href="/about" className="text-primary hover:underline font-medium">
                  Visit our About page
                </Link>{" "}
                or{" "}
                <Link href="/contact" className="text-primary hover:underline font-medium">
                  contact us
                </Link>
                .
              </p>
            </section>
          </div>
        </main>

        {/* Footer */}
        <SiteFooter />
      </div>
    </>
  )
}

// TL;DR feature points for the entity description block
const tldrPoints = [
  {
    Icon: BookOpen,
    label: "Free to Read",
    description: "Every story, every chapter — no paywall, no account needed.",
  },
  {
    Icon: PenLine,
    label: "Free to Publish",
    description: "Write and publish unlimited stories with no fees.",
  },
  {
    Icon: Heart,
    label: "100% Donations",
    description: "Readers support authors directly. FableSpace takes nothing.",
  },
  {
    Icon: Sparkles,
    label: "25+ Genres",
    description: "Fantasy, romance, sci-fi, mystery, and much more.",
  },
]

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
