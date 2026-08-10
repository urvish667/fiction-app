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
import { slugify } from "@/lib/utils"

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

export default function Home() {
  const homepageStructuredData = generateHomepageStructuredData()
  const organizationStructuredData = generateOrganizationStructuredData()
  const faqStructuredData = generateHomepageFAQStructuredData()

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
              <div className="max-w-7xl mx-auto px-4">
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
                    <Link href="/write/story-info">
                      <button
                        className="px-6 py-2.5 rounded-full text-sm font-semibold text-white/90 transition-all duration-150
                          border border-white/50 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:text-white active:scale-95"
                      >
                        Start Writing
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* ══════════════════════════════════════════════════════════════ */}

          <div className="container mx-auto px-4 py-12 space-y-8">
            <NewlyArrivedStories />
            <MostViewedStories />
            <ContinueReading />

            {/* Explore Categories */}
            <section className="bg-muted/30 rounded-3xl p-8 md:p-12">
              <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl font-bold mb-8">Explore Categories</h2>
                <div className="flex flex-wrap gap-3 justify-center">
                  {categories.map((category: string) => (
                    <Button
                      key={category}
                      variant="secondary"
                      className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
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
