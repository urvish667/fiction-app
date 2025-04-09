"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Heart, Bookmark, CheckCircle } from "lucide-react"
import Navbar from "@/components/navbar"
import ChapterList from "@/components/chapter-list"
import StoryMetadata from "@/components/story-metadata"
import CommentSection from "@/components/comment-section"
import AdBanner from "@/components/ad-banner"
import { SiteFooter } from "@/components/site-footer"
import { StoryService } from "@/services/story-service"
import { Story as StoryType, Chapter as ChapterType } from "@/types/story"

export default function StoryInfoPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const { data: session } = useSession()
  const [story, setStory] = useState<StoryType | null>(null)
  const [chapters, setChapters] = useState<ChapterType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageFallback, setImageFallback] = useState(false)

  // Fetch story data based on slug
  useEffect(() => {
    const fetchStory = async () => {
      if (!slug) return

      setIsLoading(true)
      setError(null)

      try {
        // Try to find the story by slug
        const storyBySlug = await StoryService.getStoryBySlug(slug)

        if (!storyBySlug) {
          setError("Story not found")
          setIsLoading(false)
          return
        }

        // Set the story details
        console.log('Story data from API:', storyBySlug)
        console.log('Cover image URL:', storyBySlug.coverImage)
        setStory(storyBySlug)

        // Fetch chapters for this story
        const chaptersData = await StoryService.getChapters(storyBySlug.id)

        // Always filter out draft chapters for the public story page
        const publishedChapters = chaptersData.filter(chapter => !chapter.isDraft)
        setChapters(publishedChapters)
      } catch (err) {
        console.error("Error fetching story:", err)
        setError("Failed to load story. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStory()
  }, [slug])

  // Handle back button
  const handleBack = () => {
    router.back()
  }

  // Handle start reading
  const handleStartReading = () => {
    if (chapters.length > 0) {
      // Find the first chapter by number
      const firstChapter = [...chapters].sort((a, b) => a.number - b.number)[0]
      router.push(`/story/${slug}/chapter/${firstChapter.number}`)
    }
  }

  // Handle like/unlike
  const handleLike = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/story/${slug}`)
      return
    }

    try {
      if (!story) return;

      if (story.isLiked) {
        await StoryService.unlikeStory(story.id)
      } else {
        await StoryService.likeStory(story.id)
      }

      // Refresh story data to update like status
      const updatedStory = await StoryService.getStory(story!.id)
      setStory(updatedStory)
    } catch (err) {
      console.error("Error updating like status:", err)
    }
  }

  // Handle bookmark/unbookmark
  const handleBookmark = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/story/${slug}`)
      return
    }

    try {
      if (!story) return;

      if (story.isBookmarked) {
        await StoryService.removeBookmark(story.id)
      } else {
        await StoryService.bookmarkStory(story.id)
      }

      // Refresh story data to update bookmark status
      const updatedStory = await StoryService.getStory(story!.id)
      setStory(updatedStory)
    } catch (err) {
      console.error("Error updating bookmark status:", err)
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

  if (error || !story) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <h1 className="text-2xl font-bold mb-4">{error || "Story not found"}</h1>
            <p className="text-muted-foreground mb-6">
              The story you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={handleBack}>Go Back</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-8 py-8">
        {/* Back Button and Story Status */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={handleBack} className="pl-0 flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Browse
          </Button>

          {story.status && (
            <Badge variant="outline" className="text-sm px-3 py-1 capitalize flex items-center gap-1">
              {story.status === "completed" ? <CheckCircle size={14} className="text-green-500" /> : null}
              {story.status}
            </Badge>
          )}
        </div>

        {/* Story Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Story Thumbnail */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-[16/9] rounded-lg overflow-hidden shadow-lg"
            >
              <Image
                src={imageFallback || !story.coverImage || story.coverImage.trim() === ""
                  ? "/placeholder.svg?height=1600&width=900"
                  : story.coverImage}
                alt={story.title}
                fill
                className="object-cover"
                priority
                unoptimized={true} // Always use unoptimized for external images
                onError={() => {
                  console.error('Image failed to load:', story.coverImage);
                  setImageFallback(true);
                }}
              />
            </motion.div>

            {/* Start Reading Button (Mobile) */}
            <div className="mt-6 md:hidden">
              <Button onClick={handleStartReading} className="w-full flex items-center gap-2" size="lg">
                <BookOpen size={18} />
                Start Reading
              </Button>
            </div>
          </div>

          {/* Story Details */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{story.title}</h1>

              {/* Author and Genre */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-lg">
                  By{" "}
                  <Link
                    href={`/user/${story.author?.username || "unknown"}`}
                    className="font-medium hover:underline"
                  >
                    {typeof story.author === 'object' ?
                      (story.author?.name || story.author?.username || "Unknown Author") :
                      "Unknown Author"}
                  </Link>
                </span>
                <span className="text-muted-foreground">•</span>
                <Badge variant="secondary">{story.genre || "General"}</Badge>
              </div>

              {/* Story Metadata */}
              <StoryMetadata story={story} className="mb-6" />

              {/* Story Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">
                  {story.description || "No description available for this story."}
                </p>
              </div>

              {/* Start Reading Button (Desktop) */}
              <div className="hidden md:block mb-8">
                <Button onClick={handleStartReading} className="flex items-center gap-2" size="lg">
                  <BookOpen size={18} />
                  Start Reading
                </Button>
              </div>

              {/* Like, Share, Follow */}
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant={story.isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className="flex items-center gap-2"
                >
                  <Heart size={16} className={story.isLiked ? "fill-current" : ""} />
                  {story.likeCount || 0} Likes
                </Button>

                <Button
                  variant={story.isBookmarked ? "default" : "outline"}
                  size="sm"
                  onClick={handleBookmark}
                  className="flex items-center gap-2"
                >
                  <Bookmark size={16} className={story.isBookmarked ? "fill-current" : ""} />
                  Bookmark
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Ad Banner */}
        <div className="mb-12">
          <AdBanner type="interstitial" className="w-full h-32" />
        </div>

        {/* Chapter List Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Table of Contents</h2>
          <ChapterList chapters={chapters} storySlug={slug} currentChapter={null} />
        </motion.div>

        {/* Comment Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Comments</h2>
          <CommentSection storyId={story.id} />
        </motion.div>

        {/* Support the Author Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mb-12 bg-muted/30 rounded-lg p-6 text-center"
        >
          <h2 className="text-xl font-bold mb-2">Support the Author</h2>
          <p className="text-muted-foreground mb-4">
            If you enjoyed this story, consider supporting the author to help them create more amazing content.
          </p>
          <Button variant="default">Support {typeof story.author === 'object' ?
            (story.author?.name || story.author?.username || "the Author") :
            story.author || "the Author"}</Button>
        </motion.div>
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

