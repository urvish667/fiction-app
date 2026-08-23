import Link from "next/link"
import { Navbar } from "@/components/layout"
import { getStudioUrl } from "@/lib/utils"

const HERO_VIDEO =
  "https://fablespace-assets-prod.s3.ap-south-1.amazonaws.com/site/hero/fablespace-hero.mp4"
const HERO_VIDEO_MOBILE =
  "https://fablespace-assets-prod.s3.ap-south-1.amazonaws.com/site/hero/fablespace-hero-mobile.mp4"
const HERO_FALLBACK =
  "https://fablespace-assets-prod.s3.ap-south-1.amazonaws.com/site/hero/fablespace-hero.png"

export function HeroSection() {
  return (
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
  )
}

export default HeroSection
