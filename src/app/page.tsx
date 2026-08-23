import { Metadata } from "next"
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
import { Button } from "@/components/ui/button"
import { slugify, getStudioUrl } from "@/lib/utils"
import { StoryService } from "@/lib/api/story"
import { ImageService } from "@/lib/api/images"

// ── Fonts ─────────────────────────────────────────────────────────────────
// Loaded via <link> in the section head rather than next/font so we keep
// layout.tsx untouched (user asked not to change the app-wide font).
// Instrument Serif — free on Google Fonts (the same stroke-contrast style
//   as in the mockup).
// Alegreya Sans — free humanist sans on Google Fonts, same warmth/feel.

export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageMetadata()
}

const HERO_VIDEO =
  "https://fablespace-assets-prod.s3.ap-south-1.amazonaws.com/site/hero/fablespace-hero.mp4"
const HERO_VIDEO_MOBILE =
  "https://fablespace-assets-prod.s3.ap-south-1.amazonaws.com/site/hero/fablespace-hero-mobile.mp4"
const HERO_FALLBACK =
  "https://fablespace-assets-prod.s3.ap-south-1.amazonaws.com/site/hero/fablespace-hero.png"

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

          {/* ══════════════════════════════════════════════════════════════ */}
          {/*  Hero Section                                                  */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section
            className="relative h-screen min-h-[600px] overflow-hidden flex items-center"
            aria-label="Hero"
          >

            {/* ── Background video (desktop) ── */}
            <video
              className="absolute inset-0 w-full h-full object-cover object-center hidden sm:block"
              autoPlay
              muted
              loop
              playsInline
              poster={HERO_FALLBACK}
              aria-hidden="true"
            >
              <source src={HERO_VIDEO} type="video/mp4" />
            </video>

            {/* ── Background video (mobile) ── */}
            <video
              className="absolute inset-0 w-full h-full object-cover object-center sm:hidden"
              autoPlay
              muted
              loop
              playsInline
              poster={HERO_FALLBACK}
              aria-hidden="true"
            >
              <source src={HERO_VIDEO_MOBILE} type="video/mp4" />
            </video>

            {/* ── Very subtle bottom-only vignette so text stays legible ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 40%)",
              }}
              aria-hidden="true"
            />

            {/* ── Navbar floated over the hero ── */}
            <div className="absolute top-0 left-0 w-full z-50">
              <Navbar />
            </div>

            {/* ── Hero copy ── */}
            <div className="relative z-10 w-full">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl">

                  {/* H1 — Instrument Serif italic */}
                  <h1
                    className="mb-5 leading-[1.05] text-white"
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontStyle: "italic",
                      fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
                      textShadow: "0 2px 24px rgba(0,0,0,0.4)",
                    }}
                  >
                    Every Story Opens a<br />New World
                  </h1>

                  {/* Sub-heading — Alegreya Sans */}
                  <p
                    className="mb-8 leading-relaxed"
                    style={{
                      fontFamily: "'Alegreya Sans', sans-serif",
                      fontSize: "clamp(1.15rem, 2.2vw, 1.5rem)",
                      fontWeight: 400,
                      color: "#000000",
                      textShadow: "0 1px 6px rgba(255,255,255,0.4)",
                    }}
                  >
                    Find a story to lose yourself in. Create one others won&apos;t forget.
                  </p>

                  {/* CTA buttons — Inter */}
                  <div
                    className="flex flex-row gap-3 flex-wrap"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <Link href="/browse">
                      <button
                        className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-150
                          bg-[#125ba5] hover:bg-[#0e4a8a] active:scale-95 shadow-md hover:shadow-lg"
                      >
                        Start Reading
                      </button>
                    </Link>
                    <a href={getStudioUrl()}>
                      <button
                        className="px-6 py-2.5 rounded-full text-sm font-semibold text-white/90 transition-all duration-150
                          border border-white/50 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:text-white active:scale-95"
                      >
                        Start Writing
                      </button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* ══════════════════════════════════════════════════════════════ */}

          <div className="container mx-auto px-4 py-12 space-y-8">
            <NewlyArrivedStories initialData={newestStories} />
            <MostViewedStories initialData={mostViewedStories} />
            <ContinueReading />

            {/* Explore Categories */}
            <section className="bg-muted/30 rounded-3xl p-8 md:p-12" aria-labelledby="explore-categories-heading">
              <div className="max-w-7xl mx-auto text-center">
                <h2 id="explore-categories-heading" className="text-2xl sm:text-3xl font-bold font-serif mb-4">
                  Explore Categories & Fiction Genres
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base mb-8">
                  Discover thousands of original stories spanning fantasy epics, contemporary romance, sci-fi adventures, thrillers, and mystery novels written by passionate creators worldwide.
                </p>
                <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center">
                  {categories.map((category: string) => (
                    <Button
                      key={category}
                      variant="secondary"
                      className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors text-xs sm:text-sm"
                      asChild
                    >
                      <Link href={`/browse?genre=${encodeURIComponent(slugify(category))}`}>
                        {category}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </section>

            {/* Platform Features & Reader Experience */}
            <section className="py-8 sm:py-12 border-t border-border/40" aria-labelledby="platform-features-heading">
              <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <h2 id="platform-features-heading" className="text-2xl sm:text-3xl font-bold font-serif tracking-tight mb-3">
                    Discover Original Stories & Serialized Web Fiction
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    FableSpace is an open creative storytelling ecosystem designed for fiction readers and independent authors. Read full web novels chapter-by-chapter with zero subscriptions, paywalls, or fees.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-foreground font-serif">
                      Immersive Genres & Diverse Worlds
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      From high fantasy magic and interstellar science fiction to slow-burn romance and gripping psychological thrillers, discover unique voices and serialized fiction not found anywhere else.
                    </p>
                  </div>

                  <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-foreground font-serif">
                      Continuous Chapter Updates
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Follow ongoing serials with real-time release schedules, bookmark favorite works, track your reading progress, and receive instant notifications when fresh chapters drop.
                    </p>
                  </div>

                  <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-foreground font-serif">
                      Direct Community Interaction
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Leave paragraph comments, share chapter reviews, discuss theories in dedicated author forums, and participate in lively creative writing discussions.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Author Studio & Publishing */}
            <section className="bg-muted/20 rounded-3xl p-8 md:p-12 border border-border/40" aria-labelledby="author-empowerment-heading">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 id="author-empowerment-heading" className="text-2xl sm:text-3xl font-bold font-serif tracking-tight mb-4">
                      Built for Independent Authors & Creative Storytellers
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                      Publish your original fiction with modern author tools. Maintain 100% ownership of your intellectual property, schedule chapter releases, and receive direct donations with zero platform fees.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a href={getStudioUrl()}>
                        <Button className="rounded-full px-6 bg-primary text-primary-foreground font-medium shadow-sm">
                          Open Author Studio
                        </Button>
                      </a>
                      <Button variant="outline" className="rounded-full px-6" asChild>
                        <Link href="/challenges">Join Writing Challenges</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-background p-5 rounded-xl border border-border/60">
                      <h3 className="text-base font-semibold font-serif mb-1.5">0% Platform Cut</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Writers keep 100% of direct reader tips and donations through transparent payment integration.
                      </p>
                    </div>
                    <div className="bg-background p-5 rounded-xl border border-border/60">
                      <h3 className="text-base font-semibold font-serif mb-1.5">Chapter Scheduling</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Draft in a distraction-free rich-text editor and schedule chapter drops on your own release timetable.
                      </p>
                    </div>
                    <div className="bg-background p-5 rounded-xl border border-border/60">
                      <h3 className="text-base font-semibold font-serif mb-1.5">Reader Analytics</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Track story reads, chapter completion rates, audience engagement, and follower growth in real time.
                      </p>
                    </div>
                    <div className="bg-background p-5 rounded-xl border border-border/60">
                      <h3 className="text-base font-semibold font-serif mb-1.5">Author Forum Hub</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Connect with your dedicated fanbase through author-moderated forum threads and story discussions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Frequently Asked Questions */}
            <section className="py-8 sm:py-12" aria-labelledby="homepage-faq-heading">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 id="homepage-faq-heading" className="text-2xl sm:text-3xl font-bold font-serif tracking-tight mb-2">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Everything you need to know about reading, publishing, and integrating with FableSpace.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/50">
                    <h3 className="text-base sm:text-lg font-semibold font-serif mb-2 text-foreground">
                      What is FableSpace?
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      FableSpace is an online creative fiction community and web publishing platform where independent authors publish serialized novels, short stories, and poetry, while readers discover and read original fiction for free.
                    </p>
                  </div>

                  <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/50">
                    <h3 className="text-base sm:text-lg font-semibold font-serif mb-2 text-foreground">
                      Is reading and publishing on FableSpace free?
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Yes! All stories published on FableSpace are 100% free to read without paywalls or subscriptions. Writers can publish unlimited stories and chapters at no cost.
                    </p>
                  </div>

                  <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/50">
                    <h3 className="text-base sm:text-lg font-semibold font-serif mb-2 text-foreground">
                      How can developers and AI agents access FableSpace?
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      FableSpace supports modern agentic standards including HTTP content negotiation (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">Accept: text/markdown</code>), an OpenAPI 3.1 REST API specification at <a href="/openapi.json" target="_blank" rel="noopener noreferrer" className="text-primary underline">/openapi.json</a>, and machine-readable instructions in <a href="/llms.txt" className="text-primary underline">llms.txt</a>.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

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
