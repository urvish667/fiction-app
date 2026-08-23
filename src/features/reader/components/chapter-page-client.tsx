"use client"

import "@/styles/reading.css"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Navbar, SiteFooter } from "@/components/layout"
import { MatureContentDialog, needsMatureContentConsent } from "@/components/common"
import { isUser18OrOlder } from "@/utils/age"
import { formatDate } from "@/utils/date-utils"
import { ChapterHeader } from "./chapter-header"
import { ChapterContent } from "./chapter-content"
import { ChapterNavigation } from "./chapter-navigation"
import { TopNavigation } from "./top-navigation"
import { EngagementSection } from "./engagement-section"
import { useReaderSettings } from "../hooks/use-reader-settings"
import { useReadingProgress } from "../hooks/use-reading-progress"
import { useChapterData } from "../hooks/use-chapter-data"
import type { ChapterPageClientProps } from "../types/reader.types"

export function ChapterPageClient({
  initialStory,
  initialChapter,
  initialChapters,
  slug,
  chapterNumber,
}: ChapterPageClientProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  // ── Reader Settings Hook ────────────────────────────────────────────────
  const { fontSize, adjustFontSize } = useReaderSettings(16)

  // ── Chapter Data Hook ───────────────────────────────────────────────────
  const {
    story,
    chapter,
    chapters,
    isContentLoading,
    isChapterLiked,
    setIsChapterLiked,
    isFollowing,
    setIsFollowing,
    navigateToChapter,
  } = useChapterData({
    initialStory,
    initialChapter,
    initialChapters,
    slug,
    userId: user?.id,
  })

  // ── Reading Progress Hook ───────────────────────────────────────────────
  const { readingProgress } = useReadingProgress({
    chapterId: chapter?.id,
    initialProgress: initialChapter.progress || 0,
    isAuthenticated,
    contentRef,
  })

  // ── Mature Content Consent State ────────────────────────────────────────
  const [showMatureDialog, setShowMatureDialog] = useState(false)
  const [contentConsented, setContentConsented] = useState(true)

  // ── Determine Content Word Count Classification ─────────────────────────
  const getContentLength = useCallback((content: string): "short" | "medium" | "long" => {
    const wordCount = (content || "").replace(/<[^>]*>/g, "").split(/\s+/).length
    if (wordCount > 3000) return "long"
    if (wordCount > 1000) return "medium"
    return "short"
  }, [])

  const contentLength = getContentLength(chapter?.content || "")

  // ── Update Document Title ───────────────────────────────────────────────
  useEffect(() => {
    if (!story || !chapter) return
    document.title = `${chapter.title} - Chapter ${chapter.number} - ${story.title} - FableSpace`
  }, [story, chapter])

  // ── Check Mature Content Consent (Guard Clauses) ────────────────────────
  useEffect(() => {
    if (!story?.isMature || authLoading) return

    if (isAuthenticated) {
      if (user?.birthdate) {
        const isAdult = isUser18OrOlder(new Date(user.birthdate))
        setContentConsented(isAdult)
        return
      }

      if (needsMatureContentConsent(slug, story.isMature, true)) {
        setContentConsented(false)
        setShowMatureDialog(true)
      }
      return
    }

    if (needsMatureContentConsent(slug, story.isMature, false)) {
      setContentConsented(false)
      setShowMatureDialog(true)
    }
  }, [story, isAuthenticated, authLoading, user, slug])

  // ── Copy Protection Handler ─────────────────────────────────────────────
  const handleCopyAttempt = useCallback(
    (e: React.ClipboardEvent | React.MouseEvent) => {
      e.preventDefault()
      toast({
        title: "Content Protected",
        description: "Copying content from FableSpace is not permitted to protect our authors' work.",
        variant: "destructive",
      })
    },
    [toast]
  )

  const handleBackToStory = useCallback(() => {
    router.push(`/story/${slug}`)
  }, [router, slug])

  if (!story || !chapter) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
            <p className="text-muted-foreground mb-6">The chapter you are looking for does not exist.</p>
            <Button onClick={handleBackToStory}>Back to Story</Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Reading Progress Indicator Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-primary z-50 transition-all duration-300 ease-out"
        style={{ width: `${readingProgress}%` }}
        role="progressbar"
        aria-valuenow={readingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <Navbar />

      <main className="flex-1">
        <div className="container max-w-4xl mx-auto px-4 py-6 sm:py-8">
          {/* Top Navigation */}
          <TopNavigation
            slug={slug}
            chapters={chapters}
            currentChapter={chapter}
            fontSize={fontSize}
            adjustFontSize={adjustFontSize}
            handleBackToStory={handleBackToStory}
            navigateToChapter={navigateToChapter}
          />

          {/* Chapter Header */}
          <ChapterHeader
            story={story}
            chapter={chapter}
            formatDate={formatDate}
          />

          {/* Chapter Content Body */}
          {contentConsented ? (
            <ChapterContent
              chapter={chapter}
              story={story}
              contentLength={contentLength}
              fontSize={fontSize}
              handleCopyAttempt={handleCopyAttempt}
              contentRef={contentRef}
              isContentLoading={isContentLoading}
            />
          ) : (
            <div className="bg-muted/30 p-8 rounded-lg text-center my-8">
              <h3 className="text-xl font-bold mb-2">Mature Content Warning</h3>
              <p className="text-muted-foreground mb-4">
                This chapter contains mature content and requires age verification to view.
              </p>
              <Button onClick={() => setShowMatureDialog(true)}>
                Verify Age to View
              </Button>
            </div>
          )}

          {/* Bottom Chapter Navigation */}
          <ChapterNavigation
            chapters={chapters}
            currentChapter={chapter}
            storySlug={slug}
            navigateToChapter={navigateToChapter}
          />

          {/* Engagement Section */}
          <EngagementSection
            story={story}
            chapter={chapter}
            slug={slug}
            chapterNumber={chapterNumber}
            isChapterLiked={isChapterLiked}
            isFollowing={isFollowing}
            setIsChapterLiked={setIsChapterLiked}
            setIsFollowing={setIsFollowing}
          />
        </div>
      </main>

      <SiteFooter />

      {/* Mature Content Consent Dialog */}
      <MatureContentDialog
        isOpen={showMatureDialog}
        onClose={() => setShowMatureDialog(false)}
        onConsent={() => {
          setContentConsented(true)
          setShowMatureDialog(false)
        }}
        storySlug={slug}
        storyTitle={story.title}
      />
    </div>
  )
}

export default ChapterPageClient
