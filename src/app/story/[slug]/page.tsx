"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Heart, Bookmark, CheckCircle, UserPlus, UserCheck, Loader2 } from "lucide-react"
import Navbar from "@/components/navbar"
import ChapterList from "@/components/chapter-list"
import StoryMetadata from "@/components/story-metadata"
import CommentSection from "@/components/comment-section"
import AdBanner from "@/components/ad-banner"
import { SiteFooter } from "@/components/site-footer"
import { StoryService } from "@/services/story-service"
import { Story as StoryType, Chapter as ChapterType } from "@/types/story"
import { SupportButton } from "@/components/SupportButton"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import MatureContentDialog, { needsMatureContentConsent } from "@/components/mature-content-dialog"

export default function StoryInfoPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const { data: session } = useSession()
  const { toast } = useToast()
  const [story, setStory] = useState<StoryType | null>(null)
  const [chapters, setChapters] = useState<ChapterType[]>([])
  const [storyTags, setStoryTags] = useState<{id: string, name: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageFallback, setImageFallback] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [showMatureDialog, setShowMatureDialog] = useState(false)
  const [contentConsented, setContentConsented] = useState(true)

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
        setStory(storyBySlug)

        // Check if we need to show the mature content dialog
        const isLoggedIn = status === "authenticated"
        if (storyBySlug.isMature && needsMatureContentConsent(slug, storyBySlug.isMature, isLoggedIn)) {
          setContentConsented(false)
          setShowMatureDialog(true)
        }

        // Fetch tags for this story
        try {
          const tagsData = await fetch(`/api/stories/${storyBySlug.id}/tags`).then(r => r.json())
          if (Array.isArray(tagsData)) {
            setStoryTags(tagsData)
          }
        } catch (err) {
          console.error("Error fetching story tags:", err)
        }

        // Fetch chapters for this story
        const chaptersData = await StoryService.getChapters(storyBySlug.id)

        // Always filter out draft and scheduled chapters for the public story page
        const publishedChapters = chaptersData.filter(chapter =>
          chapter.status === 'published'
        );
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

  // Refresh story data to get updated view count
  useEffect(() => {
    if (!story) return

    // Create a timer to refresh the story data after a short delay
    // This ensures the view count is updated after the view is tracked
    const timer = setTimeout(async () => {
      try {
        // Fetch the latest story data to get updated view count
        const updatedStory = await StoryService.getStory(story.id)
        if (updatedStory) {
          setStory(updatedStory)
        }
      } catch (err) {
        console.error("Error refreshing story data:", err)
      }
    }, 1000) // 1 second delay

    return () => clearTimeout(timer)
  }, [story?.id])

  // Check if the user is following the author
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session || !story || !story.author || typeof story.author !== 'object') return

      try {
        // Don't check follow status if the author is the current user
        if (story.author.id === session.user.id) return

        // Use username for follow status check
        if (story.author.username) {
          const isFollowing = await StoryService.isFollowingUser(story.author.username)
          setIsFollowing(isFollowing)
        }
      } catch (err) {
        console.error("Error checking follow status:", err)
      }
    }

    checkFollowStatus()
  }, [session, story])

  // Handle back button
  const handleBack = () => {
    router.push(`/browse`)
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
      toast({
        title: "Sign in required",
        description: "Please sign in to like this story",
        variant: "default",
        action: (
          <Button variant="default" size="sm" onClick={() => router.push(`/login?callbackUrl=/story/${slug}`)}>
            Sign in
          </Button>
        ),
      })
      return
    }

    try {
      if (!story) return;

      setLikeLoading(true)

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
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      })
    } finally {
      setLikeLoading(false)
    }
  }

  // Handle bookmark/unbookmark
  const handleBookmark = async () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark this story",
        variant: "default",
        action: (
          <Button variant="default" size="sm" onClick={() => router.push(`/login?callbackUrl=/story/${slug}`)}>
            Sign in
          </Button>
        ),
      })
      return
    }

    try {
      if (!story) return;

      setBookmarkLoading(true)

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
      toast({
        title: "Error",
        description: "Failed to update bookmark status",
        variant: "destructive"
      })
    } finally {
      setBookmarkLoading(false)
    }
  }

  // Handle follow/unfollow author
  const handleFollow = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/story/${slug}`)
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
    } finally {
      setFollowLoading(false)
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

  // Extract author details safely
  const author = story.author;

  // Handle mature content consent
  const handleMatureContentConsent = () => {
    setContentConsented(true)
    setShowMatureDialog(false)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Mature Content Dialog */}
      {showMatureDialog && !contentConsented && story && (
        <MatureContentDialog
          storySlug={slug}
          onConsent={handleMatureContentConsent}
        />
      )}

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
          {/* Left Column (Cover, Actions) */}
          <div className="md:col-span-1">
            {/* Cover Image - Change aspect ratio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-video rounded-lg overflow-hidden shadow-lg mb-6"
            >
              <Image
                src={imageFallback ? "/placeholder.svg" : story.coverImage || "/placeholder.svg"}
                alt={`${story.title} cover`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                onError={() => {
                    console.error('Image onError triggered for:', story.coverImage);
                    setImageFallback(true);
                }}
                unoptimized={true}
              />
            </motion.div>

            {/* Start Reading Button (Mobile) */}
            <div className="mt-6 md:hidden">
              <Button onClick={handleStartReading} disabled={chapters.length === 0} className="w-full flex items-center gap-2" size="lg">
                <BookOpen size={18} />
                Start Reading
              </Button>
            </div>
          </div>

          {/* Story Details (Right Column) */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{story.title}</h1>

              {/* Author Info Section with Genre */}
              {author && (
                  <div className="flex items-center flex-wrap gap-3 mb-4 text-lg">
                    <span>By</span>
                    <Link href={`/user/${author.username || ''}`} className="font-semibold hover:text-primary">
                        {author.name || author.username || 'Unknown Author'}
                    </Link>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="secondary" className="text-sm">
                      {typeof story.genre === 'object' && story.genre !== null
                        ? (story.genre as {name: string}).name
                        : (typeof story.genre === 'string' ? story.genre : 'General')}
                    </Badge>
                  </div>
              )}

              {/* Metadata (Genre, Language, Status, Counts) */}
              <StoryMetadata story={story} className="mb-6" />

              {/* Start Reading Button (Desktop) */}
              <div className="hidden md:block mb-8">
                 <Button onClick={handleStartReading} disabled={chapters.length === 0} className="flex items-center gap-2" size="lg">
                   <BookOpen size={18} />
                   Start Reading
                 </Button>
               </div>

              {/* Like, Bookmark, Follow Buttons (Original Structure) */}
              <div className="flex items-center flex-wrap gap-3 mb-6">
                <Button
                  variant={story.isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className="flex items-center gap-2"
                  title={!session ? "Sign in to like this story" : undefined}
                  disabled={likeLoading}
                >
                  {likeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Heart size={16} className={story.isLiked ? "fill-current text-red-500" : ""} />
                  )}
                  {likeLoading ? "Processing..." : `${story.likeCount || 0} Likes`}
                </Button>

                <Button
                  variant={story.isBookmarked ? "default" : "outline"}
                  size="sm"
                  onClick={handleBookmark}
                  className="flex items-center gap-2"
                  title={!session ? "Sign in to bookmark this story" : undefined}
                  disabled={bookmarkLoading}
                >
                  {bookmarkLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Bookmark size={16} className={story.isBookmarked ? "fill-current text-primary" : ""} />
                  )}
                  {bookmarkLoading ? "Processing..." : (story.isBookmarked ? 'Saved' : 'Save')}
                </Button>

                {/* Follow button - only show if author exists and is not the current user */}
                {author && session?.user?.id !== author.id && (
                   <Button
                     variant={isFollowing ? "default" : "outline"}
                     size="sm"
                     onClick={handleFollow}
                     disabled={followLoading}
                     className="flex items-center gap-2"
                   >
                     {followLoading ? (
                       <Loader2 className="h-4 w-4 animate-spin" />
                     ) : isFollowing ? (
                       <UserCheck size={16} />
                     ) : (
                       <UserPlus size={16} />
                     )}
                     {isFollowing ? "Following" : "Follow Author"}
                   </Button>
                 )}

                 {/* *** Add Support Button Here *** */}
                 {author?.donationsEnabled && (
                    <SupportButton
                        authorId={author.id}
                        donationMethod={author.donationMethod ?? null}
                        donationLink={author.donationLink ?? null}
                        authorName={author.name || author.username || 'Author'}
                        authorUsername={author.username || undefined}
                        storyId={story.id}
                        storyTitle={story.title}
                    />
                 )}
              </div>

              {/* Tags */}
              {storyTags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {storyTags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="px-3 py-1">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">
                  {story.description || "No description available for this story."}
                </p>
              </div>

              {/* Interstitial Ad between Description and Table of Contents */}
              <div className="mb-6">
                <AdBanner type="interstitial" className="w-full h-32" />
              </div>

              {/* Chapters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold mb-6">Table of Contents</h2>
                <ChapterList chapters={chapters} storySlug={slug} currentChapter={null} />
              </motion.div>

              {/* Comments */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold mb-6">Comments</h2>
                <CommentSection storyId={story.id} />
              </motion.div>
            </motion.div>
          </div>
        </div>


        {/* Support the Author Section - Only shown when monetization is enabled */}
        {author?.donationsEnabled && (
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
            <SupportButton
              authorId={author.id}
              donationMethod={author.donationMethod ?? null}
              donationLink={author.donationLink ?? null}
              authorName={author.name || author.username || 'Author'}
              authorUsername={author.username || undefined}
              storyId={story.id}
              storyTitle={story.title}
            />
          </motion.div>
        )}
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

