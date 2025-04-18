"use client"

import "@/styles/reading.css"

// React and Next.js imports
import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

// UI Components
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

// App Components
import Navbar from "@/components/navbar"
import AdBanner from "@/components/ad-banner"
import { SiteFooter } from "@/components/site-footer"

// Custom Components
import { ChapterHeader } from "@/components/chapter/ChapterHeader"
import { ChapterContent } from "@/components/chapter/ChapterContent"
import { ChapterNavigation } from "@/components/chapter/ChapterNavigation"
import { EngagementSection } from "@/components/chapter/EngagementSection"
import { TopNavigation } from "@/components/chapter/TopNavigation"

// Services and Types
import { StoryService } from "@/services/story-service"
import { Story as StoryType, Chapter as ChapterType } from "@/types/story"

// Define types for state management
interface ChapterState {
  story: StoryType | null;
  chapter: ChapterType | null;
  chapters: ChapterType[];
  isLoading: boolean;
  isContentLoading: boolean; // For content-only refreshes
  error: string | null;
  readingProgress: number;
  isLiked: boolean;
  isFollowing: boolean;
  contentLength: 'short' | 'medium' | 'long';
  fontSize: number;
}

export default function ReadingPage() {
  const params = useParams()
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()
  const { toast } = useToast()

  // Extract and parse URL parameters
  const slug = params?.slug as string
  const chapterNumber = Number.parseInt(params?.chapterNumber as string, 10)

  // State management
  const [state, setState] = useState<ChapterState>({
    story: null,
    chapter: null,
    chapters: [],
    isLoading: true,
    isContentLoading: false,
    error: null,
    readingProgress: 0,
    isLiked: false,
    isFollowing: false,
    contentLength: 'medium',
    fontSize: 16
  })

  // Destructure state for easier access
  const {
    story, chapter, chapters, isLoading, isContentLoading, error,
    readingProgress, isLiked, isFollowing, contentLength, fontSize
  } = state

  // Fetch story and chapter data
  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !chapterNumber) return

      // If we already have the chapter data and it matches the current URL, don't refetch
      if (chapter && chapter.number === chapterNumber && story && story.slug === slug) {
        return
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        // Find the story by exact slug
        const storyBySlug = await StoryService.getStoryBySlug(slug)

        // If no story found, show error
        if (!storyBySlug) {
          setState(prev => ({
            ...prev,
            error: "Story not found",
            isLoading: false
          }))
          return
        }

        // Set the story details
        const storyDetails = storyBySlug

        // Fetch chapters for this story
        const chaptersData = await StoryService.getChapters(storyDetails.id)

        // Always filter out draft and scheduled chapters for the public chapter page
        const publishedChapters = chaptersData.filter(c =>
          c.status === 'published'
        );

        // Find the current chapter by number
        const currentChapter = publishedChapters.find((c) => c.number === chapterNumber)

        if (currentChapter) {
          // Fetch the full chapter details
          const chapterDetails = await StoryService.getChapter(storyDetails.id, currentChapter.id)

          // Check if chapter is a draft or scheduled
          if (chapterDetails.status === 'draft' || chapterDetails.status === 'scheduled') {
            // If chapter is a draft or scheduled, show error
            setState(prev => ({
              ...prev,
              story: storyDetails,
              chapters: publishedChapters,
              error: "This chapter is not yet published",
              isLoading: false
            }))
          } else {
            // Determine content length based on word count
            const wordCount = (chapterDetails.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length
            let contentLengthValue: 'short' | 'medium' | 'long' = 'medium'

            if (wordCount > 3000) {
              contentLengthValue = 'long'
            } else if (wordCount > 1000) {
              contentLengthValue = 'medium'
            } else {
              contentLengthValue = 'short'
            }

            // Update state with all fetched data
            setState(prev => ({
              ...prev,
              story: storyDetails,
              chapter: chapterDetails,
              chapters: publishedChapters,
              contentLength: contentLengthValue,
              readingProgress: chapterDetails.readingProgress || 0,
              isLoading: false,
              error: null
            }))
          }
        } else {
          setState(prev => ({
            ...prev,
            story: storyDetails,
            chapters: publishedChapters,
            error: "Chapter not found",
            isLoading: false
          }))
        }
      } catch (err) {
        console.error("Error fetching chapter data:", err)
        setState(prev => ({
          ...prev,
          error: "Failed to load chapter. Please try again.",
          isLoading: false
        }))
      }
    }

    fetchData()
  }, [slug, chapterNumber])

  // Check if the user is following the author and if the story is liked
  useEffect(() => {
    const checkUserInteractions = async () => {
      if (!session || !story || !story.author || typeof story.author !== 'object') return

      try {
        let newIsFollowing = isFollowing;

        // Don't check follow status if the author is the current user
        if (story.author.id !== session.user.id && story.author.username) {
          newIsFollowing = await StoryService.isFollowingUser(story.author.username)
        }

        // Update state with user interactions
        setState(prev => ({
          ...prev,
          isFollowing: newIsFollowing,
          isLiked: story.isLiked || false
        }))
      } catch (err) {
        console.error("Error checking user interactions:", err)
      }
    }

    checkUserInteractions()
  }, [session, story, isFollowing])

  // Track reading progress with debouncing
  const updateProgressDebounced = useCallback(
    (progress: number) => {
      if (!chapter || !session?.user?.id) return;

      // Debounce the API call to avoid too many requests
      // Only send updates when progress changes by at least 5%
      const debounceProgress = Math.floor(progress / 5) * 5;

      if (Math.abs(debounceProgress - readingProgress) >= 5) {
        // Update reading progress in the API
        StoryService.updateReadingProgress(chapter.id, debounceProgress)
          .catch(err => console.error("Error updating reading progress:", err));

        // Update local state
        setState(prev => ({ ...prev, readingProgress: debounceProgress }));
      }
    },
    [chapter, readingProgress, session]
  );

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

      // Update backend with debouncing
      updateProgressDebounced(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [readingProgress, updateProgressDebounced])

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
      const chapterDetails = await StoryService.getChapter(story.id, targetChapter.id)

      // Check if chapter is published
      if (chapterDetails.status !== 'published') {
        toast({
          title: "Error",
          description: "This chapter is not yet published",
          variant: "destructive"
        })
        return false
      }

      // Determine content length based on word count
      const wordCount = (chapterDetails.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length
      let contentLengthValue: 'short' | 'medium' | 'long' = 'medium'

      if (wordCount > 3000) {
        contentLengthValue = 'long'
      } else if (wordCount > 1000) {
        contentLengthValue = 'medium'
      } else {
        contentLengthValue = 'short'
      }

      // Update state with new chapter data
      setState(prev => ({
        ...prev,
        chapter: chapterDetails,
        contentLength: contentLengthValue,
        readingProgress: chapterDetails.readingProgress || 0,
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
      console.error("Error fetching chapter data:", err)
      toast({
        title: "Error",
        description: "Failed to load chapter. Please try again.",
        variant: "destructive"
      })
      setState(prev => ({ ...prev, isContentLoading: false }))
      return false
    }
  }, [story, chapters, slug, toast])

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
      console.error("Error formatting date:", error)
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

  // Main content
  return (
    <div className="min-h-screen">
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-primary z-50 transition-all duration-300"
        style={{ width: `${readingProgress}%` }}
      />

      <Navbar />

      <main className="container mx-auto px-8 py-8">
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

        {/* Story Content */}
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
            slug={slug}
            chapterNumber={chapterNumber}
            isLiked={isLiked}
            isFollowing={isFollowing}
            setIsLiked={(value) => setState(prev => ({ ...prev, isLiked: value }))}
            setIsFollowing={(value) => setState(prev => ({ ...prev, isFollowing: value }))}
          />
        </div>
      </main>

      {/* Fixed Bottom Banner Ad */}
      <div className="sticky bottom-0 w-full z-40">
        <AdBanner type="banner" className="w-full h-16" />
      </div>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}

