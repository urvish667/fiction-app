"use client"

import "@/styles/reading.css"

// React and Next.js imports
import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

// UI Components
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import MatureContentDialog, { needsMatureContentConsent } from "@/components/mature-content-dialog"

// App Components
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"

// Custom Components
import { ChapterHeader } from "@/components/chapter/ChapterHeader"
import { ChapterContent } from "@/components/chapter/ChapterContent"
import { ChapterNavigation } from "@/components/chapter/ChapterNavigation"
import { EngagementSection } from "@/components/chapter/EngagementSection"
import { TopNavigation } from "@/components/chapter/TopNavigation"

// Services and Types
import { StoryService } from "@/lib/api/story"
import { ChapterService } from "@/lib/api/chapter"
import { ViewAPI } from "@/lib/api/view"
import { Story as StoryType, Chapter as ChapterType } from "@/types/story"
import { isUser18OrOlder } from "@/utils/age"
import { logError } from "@/lib/error-logger"

// Define types for state management
interface ChapterState {
  story: StoryType | null;
  chapter: ChapterType | null;
  chapters: ChapterType[];
  isLoading: boolean;
  isContentLoading: boolean; // For content-only refreshes
  error: string | null;
  readingProgress: number;
  isChapterLiked: boolean;
  isFollowing: boolean;
  contentLength: 'short' | 'medium' | 'long';
  fontSize: number;
}

interface ChapterPageClientProps {
  initialStory: StoryType;
  initialChapter: ChapterType & { progress?: number };
  initialChapters: ChapterType[];
  slug: string;
  chapterNumber: number;
}

export default function ChapterPageClient({
  initialStory,
  initialChapter,
  initialChapters,
  slug,
  chapterNumber
}: ChapterPageClientProps) {
  const params = useParams()
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  // Determine content length based on word count
  const getContentLength = useCallback((content: string): 'short' | 'medium' | 'long' => {
    const wordCount = (content || '').replace(/<[^>]*>/g, '').split(/\s+/).length
    if (wordCount > 3000) return 'long'
    if (wordCount > 1000) return 'medium'
    return 'short'
  }, [])

  // State management
  const [state, setState] = useState<ChapterState>({
    story: initialStory,
    chapter: initialChapter,
    chapters: initialChapters,
    isLoading: false,
    isContentLoading: false,
    error: null,
    readingProgress: initialChapter.progress || 0,
    isChapterLiked: false,
    isFollowing: false,
    contentLength: getContentLength(initialChapter.content || ''),
    fontSize: 16
  })

  // Mature content consent state
  const [showMatureDialog, setShowMatureDialog] = useState(false)
  const [contentConsented, setContentConsented] = useState(true)

  // Destructure state for easier access
  const {
    story, chapter, chapters, isLoading, isContentLoading, error,
    readingProgress, isChapterLiked, isFollowing, contentLength, fontSize
  } = state

  // Update document title when chapter changes
  useEffect(() => {
    if (story && chapter) {
      const title = `${chapter.title} - Chapter ${chapter.number} - ${story.title} - FableSpace`
      document.title = title
    }
  }, [story, chapter])

  // Check mature content consent on mount
  useEffect(() => {
    if (story && story.isMature) {
      if (isAuthenticated && !authLoading) {
        if (user?.birthdate) {
          if (isUser18OrOlder(new Date(user.birthdate))) {
            setContentConsented(true)
          } else {
            setContentConsented(false)
            // Optionally, show a message that the user is not old enough
          }
        } else {
          // If birthdate is not available, fall back to consent dialog
          if (needsMatureContentConsent(slug, story.isMature, true)) {
            setContentConsented(false)
            setShowMatureDialog(true)
          }
        }
      } else if (!isAuthenticated && !authLoading) {
        if (needsMatureContentConsent(slug, story.isMature, false)) {
          setContentConsented(false)
          setShowMatureDialog(true)
        }
      }
    }
  }, [story, isAuthenticated, authLoading, user, slug])

  // Fetch chapter like status and follow status
  useEffect(() => {
    const fetchInitialStates = async () => {
      if (!user || !chapter || !story) return;

      try {
        // Fetch chapter like status
        const likeResponse = await ChapterService.checkChapterLike(chapter.id);
        if (likeResponse.success && likeResponse.data !== undefined) {
          setState(prev => ({ ...prev, isChapterLiked: likeResponse.data || false }));
        }

        // Fetch follow status if author exists and is not the current user
        if (story.author && typeof story.author === 'object' && story.author.id !== user.id && story.author.username) {
          const followResponse = await StoryService.isFollowingUser(story.author.username);
          if (followResponse.success && followResponse.data !== undefined) {
            setState(prev => ({ ...prev, isFollowing: followResponse.data === true }));
          }
        }
      } catch (err) {
        logError(err, { context: "Error fetching initial states", chapterId: chapter?.id, userId: user?.id });
      }
    };

    fetchInitialStates();
  }, [user, chapter, story]);

  // Track chapter view on mount
  useEffect(() => {
    const trackView = async () => {
      if (!chapter) return;

      try {
        await ViewAPI.trackChapterView(chapter.id);
      } catch (error) {
        // Silently fail - view tracking shouldn't block the user experience
        console.error('Failed to track chapter view:', error);
      }
    };

    trackView();
  }, [chapter?.id]);



  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const windowHeight = scrollHeight - clientHeight;
      const progress = (scrollTop / windowHeight) * 100;
      const roundedProgress = Math.min(Math.round(progress), 100);

      // Update UI immediately for smooth progress bar
      if (roundedProgress !== readingProgress) {
        setState(prev => ({ ...prev, readingProgress: roundedProgress }));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [readingProgress])

  // Function to fetch chapter data without page navigation
  const fetchChapterData = useCallback(async (chapterNumber: number) => {
    if (!story) return false

    // Set loading state for content only
    setState(prev => ({ ...prev, isContentLoading: true }))

    try {
      // Find the chapter by number
      const targetChapter = chapters.find(c => c.number === chapterNumber)

      if (!targetChapter) {
        toast({
          title: "Error",
          description: "Chapter not found",
          variant: "destructive"
        })
        return false
      }

      // Fetch the full chapter details
      const chapterResponse = await ChapterService.getChapter(targetChapter.id)

      if (!chapterResponse.success || !chapterResponse.data) {
        toast({
          title: "Error",
          description: "Failed to load chapter",
          variant: "destructive"
        })
        return false
      }

      const chapterDetails = chapterResponse.data

      // Check if chapter is published
      if (chapterDetails.status !== 'published') {
        toast({
          title: "Error",
          description: "This chapter is not yet published",
          variant: "destructive"
        })
        return false
      }

      // Update state with new chapter data
      setState(prev => ({
        ...prev,
        chapter: chapterDetails as ChapterType,
        contentLength: getContentLength(chapterDetails.content || ''),
        readingProgress: chapterDetails.progress || 0,
        isContentLoading: false
      }))

      // Update URL without full page navigation
      window.history.pushState(
        { chapterNumber },
        '',
        `/story/${slug}/chapter/${chapterNumber}`
      )

      // Scroll to top
      window.scrollTo(0, 0)

      return true
    } catch (err) {
      logError(err, { context: "Error fetching chapter data", chapterNumber })
      toast({
        title: "Error",
        description: "Failed to load chapter. Please try again.",
        variant: "destructive"
      })
      setState(prev => ({ ...prev, isContentLoading: false }))
      return false
    }
  }, [story, chapters, slug, toast, getContentLength])

  // Handle navigation to previous/next chapter
  const navigateToChapter = useCallback((direction: "prev" | "next") => {
    if (!chapter || !chapters.length) return

    const currentIndex = chapters.findIndex((c) => c.number === chapter.number)
    if (currentIndex === -1) return

    let targetIndex
    if (direction === "prev") {
      targetIndex = currentIndex - 1
      if (targetIndex < 0) return // No previous chapter
    } else {
      targetIndex = currentIndex + 1
      if (targetIndex >= chapters.length) return // No next chapter
    }

    const targetChapter = chapters[targetIndex]
    fetchChapterData(targetChapter.number)
  }, [chapter, chapters, fetchChapterData])

  // Handle back to story info
  const handleBackToStory = useCallback(() => {
    router.push(`/story/${slug}`)
  }, [router, slug])

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.chapterNumber === 'number') {
        fetchChapterData(event.state.chapterNumber)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [fetchChapterData])

  // Increase/decrease font size
  const adjustFontSize = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      fontSize: Math.min(Math.max(prev.fontSize + amount, 12), 24)
    }))
  }, [])

  // Handle copy protection notification
  const handleCopyAttempt = useCallback((e: React.ClipboardEvent | React.MouseEvent) => {
    e.preventDefault()
    toast({
      title: "Content Protected",
      description: "This content is protected and cannot be copied.",
      variant: "default",
    })
    return false
  }, [toast])

  // Format date
  const formatDate = useCallback((dateInput: Date | string) => {
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date)
    } catch (error) {
      logError(error, { context: "Error formatting date", dateInput })
      return "Unknown date"
    }
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !story || !chapter) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <h1 className="text-2xl font-bold mb-4">{error || "Chapter not found"}</h1>
            <p className="text-muted-foreground mb-6">
              {error === "This chapter is not yet published"
                ? "This chapter is still being worked on by the author and is not yet available for reading."
                : "The chapter you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={handleBackToStory}>Back to Story</Button>
          </div>
        </div>
      </div>
    )
  }

  // Handle mature content consent
  const handleMatureContentConsent = () => {
    setContentConsented(true)
    setShowMatureDialog(false)
  }

  // Main content
  return (
    <div className="min-h-screen">
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-primary z-50 transition-all duration-300"
        style={{ width: `${readingProgress}%` }}
      />

      <Navbar />

      {/* Mature Content Dialog */}
      {showMatureDialog && !contentConsented && story && (
        <MatureContentDialog
          storySlug={slug}
          onConsent={handleMatureContentConsent}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
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

        {/* Story Content - Better mobile spacing */}
        <div className="max-w-3xl mx-auto">
          {/* Chapter Title */}
          <ChapterHeader
            story={story}
            chapter={chapter}
            formatDate={formatDate}
          />

          {/* Chapter Content */}
          <ChapterContent
            chapter={chapter}
            story={story}
            contentLength={contentLength}
            fontSize={fontSize}
            handleCopyAttempt={handleCopyAttempt}
            contentRef={contentRef}
            isContentLoading={isContentLoading}
          />

          {/* Chapter Navigation Buttons */}
          <ChapterNavigation
            chapters={chapters}
            currentChapter={chapter}
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
            setIsChapterLiked={(value) => setState(prev => ({ ...prev, isChapterLiked: value }))}
            setIsFollowing={(value) => setState(prev => ({ ...prev, isFollowing: value }))}
          />
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}
