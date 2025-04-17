"use client"

import "@/styles/reading.css"
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
import { useToast } from "@/components/ui/use-toast"
import { SupportButton } from "@/components/SupportButton"
import StoryRecommendations from "@/components/StoryRecommendations"

export default function ReadingPage() {
  const params = useParams()
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)

  const slug = params?.slug as string
  const chapterNumber = Number.parseInt(params?.chapterNumber as string, 10)

  const { data: session } = useSession()
  const { toast } = useToast()
  const [story, setStory] = useState<StoryType | null>(null)
  const [chapter, setChapter] = useState<ChapterType | null>(null)
  const [chapters, setChapters] = useState<ChapterType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [readingProgress, setReadingProgress] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [contentLength, setContentLength] = useState<'short' | 'medium' | 'long'>('medium')

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

        // Always filter out draft and scheduled chapters for the public chapter page
        const publishedChapters = chaptersData.filter(chapter =>
          chapter.status === 'published'
        );
        setChapters(publishedChapters)

        // Find the current chapter by number
        const currentChapter = publishedChapters.find((c) => c.number === chapterNumber)

        if (currentChapter) {
          // Fetch the full chapter details
          const chapterDetails = await StoryService.getChapter(storyDetails.id, currentChapter.id)

          // Check if chapter is a draft or scheduled
          if (chapterDetails.status === 'draft' || chapterDetails.status === 'scheduled') {
            // If chapter is a draft or scheduled, show error
            setError("This chapter is not yet published")
          } else {
            // Set chapter data if published
            setChapter(chapterDetails)

            // Determine content length based on word count
            const wordCount = (chapterDetails.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length
            if (wordCount > 3000) {
              setContentLength('long')
            } else if (wordCount > 1000) {
              setContentLength('medium')
            } else {
              setContentLength('short')
            }

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

  // Check if the user is following the author and if the story is liked
  useEffect(() => {
    const checkUserInteractions = async () => {
      if (!session || !story || !story.author || typeof story.author !== 'object') return

      try {
        // Don't check follow status if the author is the current user
        if (story.author.id !== session.user.id && story.author.username) {
          const isFollowing = await StoryService.isFollowingUser(story.author.username)
          setIsFollowing(isFollowing)
        }

        // Set like status based on story data
        setIsLiked(story.isLiked || false)
      } catch (err) {
        console.error("Error checking user interactions:", err)
      }
    }

    checkUserInteractions()
  }, [session, story])

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

  // Handle like/unlike story
  const handleLike = async () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like this story",
        variant: "default",
        action: (
          <Button variant="default" size="sm" onClick={() => router.push(`/login?callbackUrl=/story/${slug}/chapter/${chapterNumber}`)}>
            Sign in
          </Button>
        ),
      })
      return
    }

    if (!story) return;

    try {
      setLikeLoading(true)

      if (isLiked) {
        await StoryService.unlikeStory(story.id)
      } else {
        await StoryService.likeStory(story.id)
      }

      // Toggle like status locally
      setIsLiked(!isLiked)
    } catch (err) {
      console.error("Error updating like status:", err)
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      })
    } finally {
      setLikeLoading(false)
    }
  }

  // Handle follow/unfollow author
  const handleFollow = async () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow this author",
        variant: "default",
        action: (
          <Button variant="default" size="sm" onClick={() => router.push(`/login?callbackUrl=/story/${slug}/chapter/${chapterNumber}`)}>
            Sign in
          </Button>
        ),
      })
      return
    }

    if (!story || !story.author || typeof story.author !== 'object') return;

    // Don't allow following yourself
    if (story.author.id === session.user.id) return;

    // Need username to follow/unfollow
    if (!story.author.username) return;

    setFollowLoading(true)

    try {
      if (isFollowing) {
        await StoryService.unfollowUser(story.author.username)
        setIsFollowing(false)
      } else {
        await StoryService.followUser(story.author.username)
        setIsFollowing(true)
      }
    } catch (err) {
      console.error("Error updating follow status:", err)
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      })
    } finally {
      setFollowLoading(false)
    }
  }

  // Function to split content for ad placement
  const splitContentForAds = (content: string, parts: number, partIndex: number): string => {
    // Parse the HTML content
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const elements = Array.from(doc.body.children)

    // If no elements, return empty string
    if (elements.length === 0) return ''

    // Calculate the number of elements per part
    const elementsPerPart = Math.ceil(elements.length / parts)

    // Calculate start and end indices for the requested part
    const startIndex = partIndex * elementsPerPart
    const endIndex = Math.min(startIndex + elementsPerPart, elements.length)

    // If indices are out of range, return empty string
    if (startIndex >= elements.length) return ''

    // Create a container for the part
    const container = document.createElement('div')

    // Add the elements for this part to the container
    for (let i = startIndex; i < endIndex; i++) {
      container.appendChild(elements[i].cloneNode(true))
    }

    // Return the HTML of the container
    return container.innerHTML
  }

  // Handle copy protection notification
  const handleCopyAttempt = (e: React.ClipboardEvent | React.MouseEvent) => {
    e.preventDefault()
    toast({
      title: "Content Protected",
      description: "This content is protected and cannot be copied.",
      variant: "default",
    })
    return false
  }

  // Handle share functionality
  const handleShare = (platform: string) => {
    if (!story || !chapter) return;

    const url = `${window.location.origin}/story/${slug}/chapter/${chapterNumber}`;
    const title = `${chapter.title} - ${story.title}`;
    const text = `Check out "${chapter.title}" from ${story.title}`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}&title=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          toast({
            title: "Link copied",
            description: "Chapter link copied to clipboard",
          });
        }).catch(err => {
          console.error('Failed to copy link:', err);
          toast({
            title: "Copy failed",
            description: "Failed to copy link to clipboard",
            variant: "destructive"
          });
        });
        break;
    }
  };

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
              <Badge variant="outline">
                {typeof story.genre === 'object' && story.genre !== null
                  ? (story.genre as {name: string}).name
                  : (typeof story.genre === 'string' ? story.genre : 'General')}
              </Badge>
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
            {/* Smart Ad Placement based on content length */}
            {contentLength === 'long' ? (
              // For long content: Show ads at 1/3 and 2/3 of the content
              <>
                {/* First third of content */}
                <div
                  className="content-protected"
                  dangerouslySetInnerHTML={{
                    __html: chapter.content ?
                      splitContentForAds(chapter.content, 3, 0) :
                      'Content not available.'
                  }}
                  onContextMenu={handleCopyAttempt}
                  onCopy={handleCopyAttempt}
                  onCut={handleCopyAttempt}
                  onDrag={handleCopyAttempt}
                  onDragStart={handleCopyAttempt}
                />

                {/* First ad after 1/3 of content */}
                <AdBanner type="interstitial" className="my-8 w-full h-32" />

                {/* Second third of content */}
                <div
                  className="content-protected"
                  dangerouslySetInnerHTML={{
                    __html: chapter.content ?
                      splitContentForAds(chapter.content, 3, 1) :
                      ''
                  }}
                  onContextMenu={handleCopyAttempt}
                  onCopy={handleCopyAttempt}
                  onCut={handleCopyAttempt}
                  onDrag={handleCopyAttempt}
                  onDragStart={handleCopyAttempt}
                />

                {/* Second ad after 2/3 of content */}
                <AdBanner type="interstitial" className="my-8 w-full h-32" />

                {/* Final third of content */}
                <div
                  className="content-protected"
                  dangerouslySetInnerHTML={{
                    __html: chapter.content ?
                      splitContentForAds(chapter.content, 3, 2) :
                      ''
                  }}
                  onContextMenu={handleCopyAttempt}
                  onCopy={handleCopyAttempt}
                  onCut={handleCopyAttempt}
                  onDrag={handleCopyAttempt}
                  onDragStart={handleCopyAttempt}
                />
              </>
            ) : contentLength === 'medium' ? (
              // For medium content: Show one ad in the middle
              <>
                {/* First half of content */}
                <div
                  className="content-protected"
                  dangerouslySetInnerHTML={{
                    __html: chapter.content ?
                      splitContentForAds(chapter.content, 2, 0) :
                      'Content not available.'
                  }}
                  onContextMenu={handleCopyAttempt}
                  onCopy={handleCopyAttempt}
                  onCut={handleCopyAttempt}
                  onDrag={handleCopyAttempt}
                  onDragStart={handleCopyAttempt}
                />

                {/* Ad in the middle */}
                <AdBanner type="interstitial" className="my-8 w-full h-32" />

                {/* Second half of content */}
                <div
                  className="content-protected"
                  dangerouslySetInnerHTML={{
                    __html: chapter.content ?
                      splitContentForAds(chapter.content, 2, 1) :
                      ''
                  }}
                  onContextMenu={handleCopyAttempt}
                  onCopy={handleCopyAttempt}
                  onCut={handleCopyAttempt}
                  onDrag={handleCopyAttempt}
                  onDragStart={handleCopyAttempt}
                />
              </>
            ) : (
              // For short content: Show content first, then ad at the end
              <>
                {/* Full content */}
                <div
                  className="content-protected"
                  dangerouslySetInnerHTML={{ __html: chapter.content || 'Content not available.' }}
                  onContextMenu={handleCopyAttempt}
                  onCopy={handleCopyAttempt}
                  onCut={handleCopyAttempt}
                  onDrag={handleCopyAttempt}
                  onDragStart={handleCopyAttempt}
                />

                {/* Ad at the end */}
                <AdBanner type="interstitial" className="my-8 w-full h-32" />
              </>
            )}
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
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  disabled={likeLoading}
                  className="flex items-center gap-2"
                  title={!session ? "Sign in to like this story" : undefined}
                >
                  {likeLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-1"></div>
                  ) : (
                    <Heart size={16} className={isLiked ? "fill-current" : ""} />
                  )}
                  {isLiked ? "Liked" : "Like"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  Story Comments ({story.commentCount || 0})
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Share2 size={16} />
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleShare('twitter')}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                      </svg>
                      Twitter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('facebook')}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                      Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('copy')}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Only show follow button if user is not the author */}
              {session && story?.author && typeof story.author === 'object' &&
               session.user.id !== story.author.id ? (
                <Button
                  variant={isFollowing ? "default" : "outline"}
                  size="sm"
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="flex items-center gap-2"
                >
                  {followLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-1"></div>
                  ) : (
                    <Bell size={16} />
                  )}
                  {isFollowing ? "Following Author" : "Follow Author"}
                </Button>
              ) : session && story?.author && typeof story.author === 'object' &&
                  session.user.id === story.author.id ? (
                /* Don't show anything if user is the author */
                null
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFollow}
                  className="flex items-center gap-2"
                >
                  <Bell size={16} />
                  Follow Author
                </Button>
              )}
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
                  <h2 className="text-2xl font-bold mb-6">Story Comments</h2>
                  <CommentSection storyId={story.id} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Support the Author Section - Only shown when monetization is enabled */}
            {story.author && typeof story.author === 'object' && story.author.donationsEnabled && (
              <div className="bg-muted/30 rounded-lg p-6 text-center mb-12">
                <h2 className="text-xl font-bold mb-2">Support the Author</h2>
                <p className="text-muted-foreground mb-4">
                  If you enjoyed this chapter, consider supporting the author to help them create more amazing content.
                </p>
                <SupportButton
                  authorId={story.author.id}
                  donationMethod={story.author.donationMethod ?? null}
                  donationLink={story.author.donationLink ?? null}
                  authorName={story.author.name || story.author.username || 'Author'}
                />
              </div>
            )}

            {/* Story Recommendations */}
            <StoryRecommendations
              storyId={story.id}
              excludeSameAuthor={true}
              limit={6}
              className="mb-12"
            />
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

