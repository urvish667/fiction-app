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
  Moon,
  Sun,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/navbar"
import ChapterList from "@/components/chapter-list"
import CommentSection from "@/components/comment-section"
import AdBanner from "@/components/ad-banner"
import type { Story, Chapter } from "@/lib/types"
import { sampleStories } from "@/lib/sample-data"
import { sampleChapters } from "@/lib/sample-chapters"

export default function ReadingPage() {
  const params = useParams()
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)

  const slug = params?.slug as string
  const chapterNumber = Number.parseInt(params?.chapterNumber as string, 10)

  const [story, setStory] = useState<Story | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showComments, setShowComments] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [liked, setLiked] = useState(false)
  const [following, setFollowing] = useState(false)

  // Fetch story and chapter data
  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true)

      // Find story by ID (simulating slug)
      const foundStory = sampleStories.find((s) => s.id.toString() === slug)

      if (foundStory) {
        setStory(foundStory)

        // Get all chapters for this story
        const storyChapters = sampleChapters.filter((c) => c.storyId.toString() === slug)
        setChapters(storyChapters)

        // Get current chapter
        const currentChapter = storyChapters.find((c) => c.number === chapterNumber)
        if (currentChapter) {
          setChapter(currentChapter)
        }
      }

      setIsLoading(false)
    }

    if (slug && chapterNumber) {
      fetchData()
    }
  }, [slug, chapterNumber])

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      const windowHeight = scrollHeight - clientHeight
      const progress = (scrollTop / windowHeight) * 100
      setReadingProgress(Math.min(Math.round(progress), 100))

      // Update chapter progress in local storage
      if (chapter) {
        // In a real app, this would be sent to an API
        console.log(`Reading progress: ${progress}% for chapter ${chapter.id}`)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [chapter])

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

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
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
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

  if (!story || !chapter) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <h1 className="text-2xl font-bold mb-4">Chapter not found</h1>
            <p className="text-muted-foreground mb-6">
              The chapter you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push("/browse")}>Go to Browse</Button>
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
                      disabled={chapter.number <= 1}
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
                    Chapter {chapter.number} of {chapters.length}
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
                      disabled={chapter.number >= chapters.length}
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
                <Separator className="my-2" />
                <DropdownMenuItem onClick={() => setIsDarkMode(!isDarkMode)}>
                  {isDarkMode ? (
                    <>
                      <Sun size={16} className="mr-2" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon size={16} className="mr-2" />
                      Dark Mode
                    </>
                  )}
                </DropdownMenuItem>
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
              <Link href={`/author/${story.author.toLowerCase().replace(/\s+/g, "-")}`} className="hover:underline">
                By {story.author}
              </Link>
              <span>•</span>
              <Badge variant="outline">{story.genre}</Badge>
              <span>•</span>
              <span>Updated {formatDate(chapter.publishDate)}</span>
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
            {/* This would be the actual chapter content, rendered from markdown */}
            <p>
              The lighthouse stood tall against the darkening sky, its beam cutting through the encroaching fog like a
              sword of light. Emma had never seen anything quite like it—a solitary sentinel against the coming night.
            </p>

            <p>
              "It's been here for centuries," her grandfather said, his voice barely audible above the crashing waves.
              "Some say it's the last of its kind."
            </p>

            <p>
              Emma nodded, though she wasn't entirely sure what he meant. At twelve years old, she had seen lighthouses
              before, in books and movies. But there was something different about this one, something almost alive in
              the way it pulsed with light.
            </p>

            <AdBanner type="interstitial" className="my-8 w-full h-32" />

            <p>"Can we go inside?" she asked, already moving toward the winding path that led up the cliff.</p>

            <p>
              Her grandfather hesitated, glancing at the darkening horizon. "We shouldn't stay long. The tide comes in
              quickly here, and when darkness falls..." He trailed off, leaving the warning unfinished.
            </p>

            <p>
              But Emma was already halfway up the path, her curiosity pulling her forward like an invisible thread. The
              lighthouse called to her, its rhythmic flashes seeming to speak a language she almost understood.
            </p>

            <p>
              The door at the base was heavier than she expected, ancient wood bound with iron that had turned green
              with age. It swung open with a groan that seemed to echo up the spiral staircase within.
            </p>

            <p>
              "Hello?" Emma called, her voice bouncing back at her from stone walls. No answer came, but she hadn't
              really expected one. According to her grandfather, the lighthouse had been automated decades ago, its
              human keepers replaced by machines.
            </p>

            <p>
              "We really shouldn't be in here," her grandfather said as he stepped in behind her, but there was a note
              of resignation in his voice. He knew as well as she did that they would climb to the top.
            </p>

            <p>
              The stairs wound upward in a tight spiral, each step worn smooth by generations of keepers' feet. Emma ran
              her hand along the wall as she climbed, feeling the cool stone beneath her fingertips. It was almost as if
              the lighthouse was breathing, a slow and steady rhythm that matched the pulse of its light.
            </p>

            <AdBanner type="interstitial" className="my-8 w-full h-32" />

            <p>
              When they reached the top, Emma gasped. The lantern room was a marvel of glass and brass, the massive lens
              at its center catching and amplifying the light from a source she couldn't quite see. But it wasn't the
              mechanism that took her breath away—it was the view.
            </p>

            <p>
              From this height, she could see for miles in every direction. The ocean stretched to the horizon, a vast
              expanse of deepening blue as twilight settled over the world. But to the east, where the land should have
              been, there was only darkness.
            </p>

            <p>"Grandfather," she whispered, "where are the lights from the town?"</p>

            <p>
              He stood beside her, his weathered face solemn in the glow of the lighthouse beam. "That's why they call
              it the Last Lighthouse, Emma. It stands at the edge of our world, keeping the darkness at bay."
            </p>

            <p>
              As if on cue, the darkness to the east seemed to shift and move, like something alive and hungry. Emma
              felt a chill run down her spine that had nothing to do with the evening air.
            </p>

            <p>"What is it?" she asked, though part of her didn't want to know.</p>

            <p>
              "Some call it the Void," her grandfather replied. "Others have different names for it. But all agree on
              one thing—it consumes. Towns, cities, entire countries have been swallowed by it over the centuries. And
              it's still growing."
            </p>

            <p>
              Emma stared at the darkness, trying to make sense of what she was seeing. It wasn't just an absence of
              light—it was something more, something that seemed to devour the very concept of existence.
            </p>

            <p>"And the lighthouse stops it?" she asked, her voice small.</p>

            <p>
              "For now," her grandfather said. "As long as the light shines, the darkness cannot advance. That's why it
              must never go out."
            </p>

            <p>
              As they watched, the beam of light swept across the boundary between the world and the Void. Where it
              touched, the darkness recoiled, hissing like water on hot metal.
            </p>

            <p>
              "But what happens when the lighthouse fails?" Emma asked, unable to tear her eyes away from the spectacle.
            </p>

            <p>
              Her grandfather was silent for a long moment. "Then we'll need someone brave enough to become the new
              light," he finally said, placing a hand on her shoulder. "Someone who isn't afraid of the dark."
            </p>

            <p>
              Emma felt something stir within her, a sense of purpose she had never known before. She placed her hand on
              the cool glass of the lantern room, feeling the pulse of the light through her palm.
            </p>

            <p>"I'm not afraid," she whispered, and in that moment, the light seemed to burn just a little brighter.</p>
          </motion.div>

          {/* Chapter Navigation Buttons */}
          <div className="flex justify-between items-center mb-12">
            <Button
              variant="outline"
              onClick={() => navigateToChapter("prev")}
              disabled={chapter.number <= 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Previous Chapter
            </Button>

            <Button
              variant="outline"
              onClick={() => navigateToChapter("next")}
              disabled={chapter.number >= chapters.length}
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
                  Comments ({story.comments})
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
              <Button variant="default">Support {story.author}</Button>
            </div>

            {/* More from this Author */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">More from {story.author}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sampleStories.slice(0, 3).map((relatedStory) => (
                  <Link key={relatedStory.id} href={`/story/${relatedStory.id}`} className="group block">
                    <div className="border rounded-lg overflow-hidden transition-all group-hover:border-primary">
                      <div className="aspect-[3/2] relative bg-muted">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="text-muted-foreground" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {relatedStory.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{relatedStory.excerpt}</p>
                      </div>
                    </div>
                  </Link>
                ))}
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
      <footer className="py-10 px-4 bg-muted">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold font-serif">FableSpace</h2>
              <p className="text-muted-foreground">Unleash your stories, one page at a time.</p>
            </div>
            <div className="flex gap-8">
              <div>
                <h3 className="font-medium mb-2">Platform</h3>
                <ul className="space-y-1">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Browse
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Write
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Challenges
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Company</h3>
                <ul className="space-y-1">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FableSpace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

