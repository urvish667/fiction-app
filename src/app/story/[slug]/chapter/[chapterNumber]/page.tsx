"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  List,
  Heart,
  MessageSquare,
  Share2,
  Bell,
  BookOpen,
  AlignJustify,
  Minus,
  Plus,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/navbar"
import ChapterList from "@/components/chapter-list"
import CommentSection from "@/components/comment-section"
import AdBanner from "@/components/ad-banner"
import { SiteFooter } from "@/components/site-footer"
import { useSession } from "next-auth/react"
import { StoryService } from "@/services/story-service"
import { Story as StoryType, Chapter as ChapterType } from "@/types/story"

export default function ReadingPage() {
  const params = useParams()
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)

  const slug = params?.slug as string
  const chapterNumber = Number.parseInt(params?.chapterNumber as string, 10)

  const { data: session } = useSession()
  const [story, setStory] = useState<StoryType | null>(null)
  const [chapter, setChapter] = useState<ChapterType | null>(null)
  const [chapters, setChapters] = useState<ChapterType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [readingProgress, setReadingProgress] = useState(0)
  const [liked, setLiked] = useState(false)
  const [following, setFollowing] = useState(false)

  // Fetch story and chapter data
  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !chapterNumber) return

      // If we already have the chapter data and it matches the current URL, don't refetch
      if (chapter && chapter.number === chapterNumber && story && story.slug === slug) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Find the story by exact slug
        const storyBySlug = await StoryService.getStoryBySlug(slug)

        // If no story found, show error
        if (!storyBySlug) {
          setError("Story not found")
          setIsLoading(false)
          return
        }

        // Set the story details
        const storyDetails = storyBySlug
        setStory(storyDetails)

        // Fetch chapters for this story
        const chaptersData = await StoryService.getChapters(storyDetails.id)

        // Always filter out draft chapters for the public chapter page
        const publishedChapters = chaptersData.filter(chapter => !chapter.isDraft)
        setChapters(publishedChapters)

        // Find the current chapter by number
        const currentChapter = publishedChapters.find((c) => c.number === chapterNumber)

        if (currentChapter) {
          // Fetch the full chapter details
          const chapterDetails = await StoryService.getChapter(storyDetails.id, currentChapter.id)

          // Check if chapter is a draft
          if (chapterDetails.isDraft) {
            // If chapter is a draft, show error
            setError("This chapter is not yet published")
          } else {
            // Set chapter data if published
            setChapter(chapterDetails)

            // Update reading progress if available
            if (chapterDetails.readingProgress) {
              setReadingProgress(chapterDetails.readingProgress)
            }
          }
        } else {
          setError("Chapter not found")
        }
      } catch (err) {
        console.error("Error fetching chapter data:", err)
        setError("Failed to load chapter. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [slug, chapterNumber, chapter, story])

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      const windowHeight = scrollHeight - clientHeight
      const progress = (scrollTop / windowHeight) * 100
      setReadingProgress(Math.min(Math.round(progress), 100))

      // Update chapter progress in the API
      if (chapter && session?.user?.id) {
        // Debounce the API call to avoid too many requests
        // Only send updates when progress changes by at least 5%
        const debounceProgress = Math.floor(progress / 5) * 5

        if (Math.abs(debounceProgress - readingProgress) >= 5) {
          // Update reading progress in the API
          StoryService.updateReadingProgress(chapter.id, debounceProgress)
            .catch(err => console.error("Error updating reading progress:", err))

          // Update local state
          setReadingProgress(debounceProgress)
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [chapter])

  // Handle navigation to previous/next chapter
  const navigateToChapter = (direction: "prev" | "next") => {
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
    router.push(`/story/${slug}/chapter/${targetChapter.number}`)
  }

  // Handle back to story info
  const handleBackToStory = () => {
    router.push(`/story/${slug}`)
  }

  // Increase/decrease font size
  const adjustFontSize = (amount: number) => {
    setFontSize((prev) => Math.min(Math.max(prev + amount, 12), 24))
  }

  // Format date
  const formatDate = (dateInput: Date | string) => {
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
  }

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
            <Button onClick={() => router.push(`/story/${slug}`)}>Back to Story</Button>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={handleBackToStory} className="pl-0 flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Story
          </Button>

          <div className="flex items-center gap-2">
            {/* Chapter Navigation */}
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateToChapter("prev")}
                      disabled={chapters.findIndex((c) => c.number === chapter.number) <= 0}
                    >
                      <ChevronLeft size={16} />
                      <span className="sr-only">Previous Chapter</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Previous Chapter</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Chapter Selector */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="mx-2 text-sm">
                    Chapter {chapters.findIndex((c) => c.number === chapter.number) + 1} of {chapters.length}
                    <List size={16} className="ml-2" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Table of Contents</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <ChapterList chapters={chapters} storySlug={slug} currentChapter={chapter.number} />
                  </div>
                </SheetContent>
              </Sheet>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateToChapter("next")}
                      disabled={chapters.findIndex((c) => c.number === chapter.number) >= chapters.length - 1}
                    >
                      <ChevronRight size={16} />
                      <span className="sr-only">Next Chapter</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next Chapter</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Reading Settings */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <AlignJustify size={16} />
                        <span className="sr-only">Reading Settings</span>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Reading Settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">Font Size</p>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="icon" onClick={() => adjustFontSize(-1)}>
                      <Minus size={14} />
                    </Button>
                    <span className="mx-2">{fontSize}px</span>
                    <Button variant="outline" size="icon" onClick={() => adjustFontSize(1)}>
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Story Content */}
        <div className="max-w-3xl mx-auto">
          {/* Chapter Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">{chapter.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link href={`/story/${slug}`} className="font-medium hover:underline">
                {story.title}
              </Link>
              <span>•</span>
              <Link href={`/user/${story.author?.username || "unknown"}`} className="hover:underline">
                By {typeof story.author === 'object' ?
                  (story.author?.name || story.author?.username || "Unknown Author") :
                  "Unknown Author"}
              </Link>
              <span>•</span>
              <Badge variant="outline">{story.genre}</Badge>
              <span>•</span>
              <span>Updated {formatDate(chapter.updatedAt)}</span>
            </div>
          </motion.div>

          {/* Chapter Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            ref={contentRef}
            className="prose prose-lg dark:prose-invert max-w-none mb-12"
            style={{ fontSize: `${fontSize}px` }}
          >
            {/* Render the actual chapter content */}
            <div dangerouslySetInnerHTML={{ __html: chapter.content || 'Content not available.' }} />

            <AdBanner type="interstitial" className="my-8 w-full h-32" />
          </motion.div>

          {/* Chapter Navigation Buttons */}
          <div className="flex justify-between items-center mb-12">
            <Button
              variant="outline"
              onClick={() => navigateToChapter("prev")}
              disabled={chapters.findIndex((c) => c.number === chapter.number) <= 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Previous Chapter
            </Button>

            <Button
              variant="outline"
              onClick={() => navigateToChapter("next")}
              disabled={chapters.findIndex((c) => c.number === chapter.number) >= chapters.length - 1}
              className="flex items-center gap-2"
            >
              Next Chapter
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Engagement Section */}
          <div className="border-t pt-8 mb-12">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant={liked ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLiked(!liked)}
                  className="flex items-center gap-2"
                >
                  <Heart size={16} className={liked ? "fill-white" : ""} />
                  {liked ? "Liked" : "Like"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  Comments ({story.commentCount || 0})
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Share2 size={16} />
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Twitter</DropdownMenuItem>
                    <DropdownMenuItem>Facebook</DropdownMenuItem>
                    <DropdownMenuItem>Copy Link</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                variant={following ? "default" : "outline"}
                size="sm"
                onClick={() => setFollowing(!following)}
                className="flex items-center gap-2"
              >
                <Bell size={16} />
                {following ? "Following Author" : "Follow Author"}
              </Button>
            </div>

            {/* Comments Section (Conditionally Rendered) */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-12"
                >
                  <h2 className="text-2xl font-bold mb-6">Comments</h2>
                  <CommentSection storyId={story.id} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Support the Author Section */}
            <div className="bg-muted/30 rounded-lg p-6 text-center mb-12">
              <h2 className="text-xl font-bold mb-2">Support the Author</h2>
              <p className="text-muted-foreground mb-4">
                If you enjoyed this chapter, consider supporting the author to help them create more amazing content.
              </p>
              <Button variant="default">Support {typeof story.author === 'object' ?
                (story.author?.name || story.author?.username || "the Author") :
                story.author || "the Author"}</Button>
            </div>

            {/* More from this Author */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">More from {typeof story.author === 'object' ?
                (story.author?.name || story.author?.username || "this author") :
                "this author"}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Sample stories will be loaded dynamically */}
                <div className="border rounded-lg overflow-hidden transition-all hover:border-primary">
                  <div className="aspect-[3/2] relative bg-muted">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="text-muted-foreground" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium line-clamp-1 hover:text-primary transition-colors">Coming soon</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">More stories from this author will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

