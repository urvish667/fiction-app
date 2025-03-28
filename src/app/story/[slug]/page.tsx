"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen } from "lucide-react"
import Navbar from "@/components/navbar"
import ChapterList from "@/components/chapter-list"
import StoryMetadata from "@/components/story-metadata"
import LikeShareFollow from "@/components/like-share-follow"
import CommentSection from "@/components/comment-section"
import AdBanner from "@/components/ad-banner"
import type { Story, Chapter } from "@/lib/types"
import { sampleStories } from "@/lib/sample-data"
import { sampleChapters } from "@/lib/sample-chapters"

export default function StoryInfoPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [story, setStory] = useState<Story | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch story data based on slug
  useEffect(() => {
    // In a real app, this would be an API call
    // For demo purposes, we're using sample data
    const fetchStory = () => {
      setIsLoading(true)

      // Find story by converting ID to string (simulating slug)
      const foundStory = sampleStories.find((s) => s.id.toString() === slug)

      if (foundStory) {
        setStory(foundStory)
        // Get chapters for this story
        const storyChapters = sampleChapters.filter((c) => c.storyId.toString() === slug)
        setChapters(storyChapters)
      }

      setIsLoading(false)
    }

    if (slug) {
      fetchStory()
    }
  }, [slug])

  // Handle back button
  const handleBack = () => {
    router.back()
  }

  // Handle start reading
  const handleStartReading = () => {
    if (chapters.length > 0) {
      router.push(`/story/${slug}/chapter/1`)
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

  if (!story) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <h1 className="text-2xl font-bold mb-4">Story not found</h1>
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
        {/* Back Button */}
        <Button variant="ghost" onClick={handleBack} className="mb-6 pl-0 flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to Browse
        </Button>

        {/* Story Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Story Thumbnail */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg"
            >
              <Image
                src={story.thumbnail || "/placeholder.svg?height=600&width=400"}
                alt={story.title}
                fill
                className="object-cover"
                priority
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
                    href={`/author/${story.author.toLowerCase().replace(/\s+/g, "-")}`}
                    className="font-medium hover:underline"
                  >
                    {story.author}
                  </Link>
                </span>
                <span className="text-muted-foreground">•</span>
                <Badge variant="secondary">{story.genre}</Badge>
              </div>

              {/* Story Metadata */}
              <StoryMetadata story={story} className="mb-6" />

              {/* Story Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">
                  {story.excerpt}
                  {/* Adding more text for a realistic description */}
                  {` In this captivating tale, readers will embark on a journey through ${story.genre.toLowerCase()} worlds, 
                  exploring themes of adventure, discovery, and personal growth. The author weaves a rich tapestry of 
                  characters and settings that will keep you engaged from the first page to the last.`}
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
              <LikeShareFollow story={story} />
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
          <Button variant="default">Support {story.author}</Button>
        </motion.div>
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

