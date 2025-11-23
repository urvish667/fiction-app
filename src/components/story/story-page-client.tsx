"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, BookOpen, Heart, Bookmark, CheckCircle, UserPlus, UserCheck, Loader2, Flag, Users } from "lucide-react"
import Navbar from "@/components/navbar"
import { ReportDialog } from "@/components/report/ReportDialog"
import ChapterList from "@/components/chapter-list"
import StoryMetadata from "@/components/story-metadata"
import CommentSection from "@/components/comment-section"
import AdBanner from "../ad-banner"
import { SiteFooter } from "@/components/site-footer"
import { StoryService } from "@/lib/api/story"
import { UserService } from "@/lib/api/user"
import { ImageService } from "@/lib/api/images"
import { ViewAPI } from "@/lib/api/view"
import { Story as StoryType, Chapter as ChapterType } from "@/types/story"
import { SupportButton } from "@/components/SupportButton"
import MatureContentDialog, { needsMatureContentConsent } from "@/components/mature-content-dialog"
import { logError } from "@/lib/error-logger"
import { isUser18OrOlder } from "@/utils/age"

interface StoryPageClientProps {
  initialStory: StoryType
  initialChapters: ChapterType[]
  initialTags: { id: string; name: string }[]
  slug: string
}

export default function StoryPageClient({
  initialStory,
  initialChapters,
  initialTags,
  slug
}: StoryPageClientProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { toast } = useToast()

  // State management
  const [story, setStory] = useState<StoryType>(initialStory)
  const [chapters, setChapters] = useState<ChapterType[]>(initialChapters)
  const [storyTags, setStoryTags] = useState<{ id: string, name: string }[]>(initialTags)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFallback, setImageFallback] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [showMatureDialog, setShowMatureDialog] = useState(false)
  const [isReportModalOpen, setReportModalOpen] = useState(false)
  const [contentConsented, setContentConsented] = useState(true)
  const [isForumEnabled, setIsForumEnabled] = useState(false)
  const [forumLoading, setForumLoading] = useState(true)

  // Track story view on mount
  useEffect(() => {
    const trackView = async () => {
      try {
        await ViewAPI.trackStoryView(story.id);
      } catch (error) {
        // Silently fail - view tracking shouldn't block the user experience
        console.error('Failed to track story view:', error);
      }
    };

    trackView();
  }, [story.id]);

  // Check mature content consent on mount
  useEffect(() => {
    if (story.isMature) {
      if (isAuthenticated && !isLoading) {
        // Note: Our current auth system doesn't include birthdate
        // For now, we assume authenticated users are old enough for mature content
        // In the future, we could add birthdate to the user profile
        setContentConsented(true)
      } else if (!isAuthenticated && !isLoading) {
        if (needsMatureContentConsent(slug, story.isMature, false)) {
          setContentConsented(false)
          setShowMatureDialog(true)
        }
      }
    }
  }, [story.isMature, slug, isAuthenticated, isLoading])

  // Fetch like and bookmark status when user is authenticated
  useEffect(() => {
    const fetchInteractionStatus = async () => {
      if (!user || !story) return;

      try {
        const [likeResponse, bookmarkResponse] = await Promise.all([
          StoryService.checkStoryLike(story.id),
          StoryService.checkStoryBookmark(story.id)
        ]);

        if (likeResponse.success && likeResponse.data !== undefined) {
          setStory(s => ({
            ...s,
            isLiked: likeResponse.data,
            likeCount: (likeResponse as any).likeCount !== undefined ? (likeResponse as any).likeCount : s.likeCount
          }));
        }

        if (bookmarkResponse.success && bookmarkResponse.data !== undefined) {
          setStory(s => ({ ...s, isBookmarked: bookmarkResponse.data }));
        }
      } catch (err) {
        logError(err, { context: "Error fetching interaction status", storyId: story.id, userId: user.id });
      }
    };

    fetchInteractionStatus();
  }, [user, story.id])

  // Combined check for follow status and forum settings to minimize API calls
  useEffect(() => {
    const checkAuthorData = async () => {
      if (!user || !story || !story.author || typeof story.author !== 'object') {
        setForumLoading(false)
        return
      }

      try {
        // Don't check follow status if the author is the current user
        if (story.author.id === user.id) {
          setForumLoading(false)
          return
        }

        // Batch the follow status and profile checks
        const [followResponse, profileResponse] = await Promise.all([
          story.author.username ? StoryService.isFollowingUser(story.author.username) : Promise.resolve({ success: false } as const),
          story.author.username ? UserService.getUserProfile(story.author.username) : Promise.resolve({ success: false } as const)
        ])

        // Set follow status
        if (followResponse.success && 'data' in followResponse && followResponse.data !== undefined) {
          setIsFollowing(followResponse.data)
        }

        // Set forum setting
        if (profileResponse.success && 'data' in profileResponse && profileResponse.data) {
          const forumEnabled = profileResponse.data.preferences?.privacySettings?.forum === true
          setIsForumEnabled(forumEnabled)
        }
      } catch (err) {
        logError(err, { context: "Error checking author data", authorId: story.author.id, userId: user?.id })
      } finally {
        setForumLoading(false)
      }
    }

    checkAuthorData()
  }, [user, story])

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
    if (!user) {
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

      let response;
      if (story.isLiked) {
        response = await StoryService.unlikeStory(story.id)
      } else {
        response = await StoryService.likeStory(story.id)
      }

      // Check if the API call was successful
      if (response.success) {
        setStory(s => ({
          ...s,
          isLiked: !s.isLiked,
          likeCount: s.isLiked ? (s.likeCount ?? 0) - 1 : (s.likeCount ?? 0) + 1
        }))
      } else {
        throw new Error(response.message || "Failed to update like status")
      }
    } catch (err) {
      logError(err, { context: "Error updating like status", storyId: story?.id, userId: user?.id })
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
    if (!user) {
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

      let response;
      if (story.isBookmarked) {
        response = await StoryService.removeBookmark(story.id)
      } else {
        response = await StoryService.bookmarkStory(story.id)
      }

      // Check if the API call was successful
      if (response.success) {
        setStory(s => ({
          ...s,
          isBookmarked: !s.isBookmarked,
          bookmarkCount: s.isBookmarked ? (s.bookmarkCount ?? 0) - 1 : (s.bookmarkCount ?? 0) + 1
        }))
      } else {
        throw new Error(response.message || "Failed to update bookmark status")
      }
    } catch (err) {
      logError(err, { context: "Error updating bookmark status", storyId: story?.id, userId: user?.id })
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
    if (!user) {
      router.push(`/login?callbackUrl=/story/${slug}`)
      return
    }

    if (!story || !story.author || typeof story.author !== 'object') return;

    // Don't allow following yourself
    if (story.author.id === user.id) return;

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
      logError(err, { context: "Error updating follow status", authorId: story?.author?.id, userId: user?.id })
    } finally {
      setFollowLoading(false)
    }
  }

  // Handle mature content consent
  const handleMatureContentConsent = () => {
    setContentConsented(true)
    setShowMatureDialog(false)
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
      <ReportDialog
        isOpen={isReportModalOpen}
        onClose={() => setReportModalOpen(false)}
        storyId={story.id}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button and Story Status */}
          <div className="flex justify-between items-center gap-3 mb-4 sm:mb-6">
            <Button variant="ghost" onClick={handleBack} className="pl-0 flex items-center gap-2 flex-shrink-0">
              <ArrowLeft size={16} />
              <span className="text-sm sm:text-base">Back to Browse</span>
            </Button>

            {story.status && (
              <Badge variant="outline" className="text-sm px-3 py-1 capitalize flex items-center gap-1 flex-shrink-0">
                {story.status === "completed" ? <CheckCircle size={14} className="text-green-500" /> : null}
                {story.status}
              </Badge>
            )}
          </div>

          {/* Story Overview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">
            {/* Left Column (Cover, Actions) */}
            <div className="lg:col-span-1">
              {/* Cover Image - Better mobile aspect ratio */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative aspect-video w-full max-w-md mx-auto lg:mx-0 rounded-lg overflow-hidden shadow-lg mb-4 sm:mb-6"
              >
                <Image
                  src={imageFallback ? "/placeholder.svg" : (ImageService.getImageUrl(story.coverImage) || "/placeholder.svg")}
                  alt={`${story.title} cover`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  onError={() => {
                    logError(`Image loading failed`, { context: 'Cover image error', imageUrl: ImageService.getImageUrl(story.coverImage) });
                    setImageFallback(true);
                  }}
                  unoptimized={true}
                />
                {/* 18+ Tag for mature content */}
                {story.isMature && (
                  <Badge className="absolute top-3 left-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-3 py-1 z-10">
                    18+
                  </Badge>
                )}
              </motion.div>

              {/* Start Reading Button (Mobile) */}
              <div className="mt-4 lg:hidden">
                <Button
                  onClick={handleStartReading}
                  disabled={chapters.length === 0}
                  className="w-full flex items-center justify-center gap-2 h-12 text-base font-medium"
                  size="lg"
                >
                  <BookOpen size={20} />
                  Start Reading
                </Button>
              </div>
            </div>

            {/* Story Details (Right Column) */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-2 leading-tight">{story.title}</h1>

                {/* Author Info Section with Genre */}
                {author && (
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-4 text-base sm:text-lg">
                    <span>By</span>
                    <Link href={`/user/${author.username || ''}`} className="font-semibold hover:text-primary">
                      {author.name || author.username || 'Unknown Author'}
                    </Link>
                    <span className="text-muted-foreground hidden xs:inline">•</span>
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      {typeof story.genre === 'object' && story.genre !== null
                        ? (story.genre as { name: string }).name
                        : (typeof story.genre === 'string' ? story.genre : 'General')}
                    </Badge>
                  </div>
                )}

                {/* Metadata (Genre, Language, Status, Counts) */}
                <StoryMetadata story={story} className="mb-4 sm:mb-6" showLicense={true} />

                {/* Start Reading Button (Desktop) */}
                <div className="hidden lg:block mb-6 lg:mb-8">
                  <Button
                    onClick={handleStartReading}
                    disabled={chapters.length === 0}
                    className="flex items-center gap-2 h-12 text-base font-medium"
                    size="lg"
                  >
                    <BookOpen size={20} />
                    Start Reading
                  </Button>
                </div>

                {/* Like, Bookmark, Follow Buttons - Mobile Optimized */}
                <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <Button
                    variant={story.isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className="flex items-center gap-1 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                    title={!user ? "Sign in to like this story" : undefined}
                    disabled={likeLoading}
                  >
                    {likeLoading ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <Heart size={14} className={story.isLiked ? "fill-current text-red-500" : ""} />
                    )}
                    <span className="hidden xs:inline">
                      {likeLoading ? "Processing..." : `${story.likeCount || 0} Likes`}
                    </span>
                    <span className="xs:hidden">
                      {likeLoading ? "..." : `${story.likeCount || 0}`}
                    </span>
                  </Button>

                  <Button
                    variant={story.isBookmarked ? "default" : "outline"}
                    size="sm"
                    onClick={handleBookmark}
                    className="flex items-center gap-1 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                    title={!user ? "Sign in to bookmark this story" : undefined}
                    disabled={bookmarkLoading}
                  >
                    {bookmarkLoading ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <Bookmark size={14} className={story.isBookmarked ? "fill-current text-primary" : ""} />
                    )}
                    <span className="hidden xs:inline">
                      {bookmarkLoading ? "Processing..." : (story.isBookmarked ? 'Saved' : 'Save')}
                    </span>
                    <span className="xs:hidden">
                      {bookmarkLoading ? "..." : (story.isBookmarked ? '✓' : '+')}
                    </span>
                  </Button>

                  {/* Follow button - only show if author exists and is not the current user */}
                  {author && user?.id !== author.id && (
                    <Button
                      variant={isFollowing ? "default" : "outline"}
                      size="sm"
                      onClick={handleFollow}
                      disabled={followLoading}
                      className="flex items-center gap-1 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                    >
                      {followLoading ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : isFollowing ? (
                        <UserCheck size={14} />
                      ) : (
                        <UserPlus size={14} />
                      )}
                      <span className="hidden sm:inline">
                        {isFollowing ? "Following" : "Follow Author"}
                      </span>
                      <span className="sm:hidden">
                        {isFollowing ? "Following" : "Follow"}
                      </span>
                    </Button>
                  )}
                  {/* Forum Button - Only show if forum is enabled and author exists */}
                  {!forumLoading && isForumEnabled && author?.username && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                            asChild
                          >
                            <Link href={`/user/${author.username}/forum`}>
                              <Users size={14} />
                              <span className="hidden sm:inline">Forum</span>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportModalOpen(true)}
                    className="flex items-center gap-1 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                  >
                    <Flag size={14} />
                    <span className="hidden sm:inline">Report</span>
                  </Button>

                  {/* Support Button - Mobile Optimized */}
                  {author?.donationsEnabled && user?.id !== author.id && (
                    <div className="w-full sm:w-auto mt-2 sm:mt-0">
                      {!story.isOriginal ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 text-orange-600 border-orange-500 hover:bg-orange-50"
                          asChild
                        >
                          <Link href={`/user/${author.username}`}>
                            <Heart size={14} />
                            <span className="hidden sm:inline">Visit Profile</span>
                            <span className="sm:hidden">Profile</span>
                          </Link>
                        </Button>
                      ) : author.donationLink ? (
                        <SupportButton
                          authorId={author.id}
                          donationMethod={author.donationMethod ?? null}
                          donationLink={author.donationLink ?? null}
                          authorName={author.name || author.username || 'Author'}
                          authorUsername={author.username || undefined}
                          storyId={story.id}
                          storyTitle={story.title}
                        />
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {storyTags.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {storyTags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Description</h2>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {story.description || "No description available for this story."}
                  </p>
                </div>

                {/* Interstitial Ad between Description and Table of Contents */}
                <div className="w-full py-2">
                  <AdBanner
                    type="banner"
                    className="w-full max-w-[720px] h-[90px] mx-auto"
                    slot="6596765108"
                  />
                </div>

                {/* Chapters */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mb-8 sm:mb-12 py-4"
                >
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Table of Contents</h2>
                  <ChapterList chapters={chapters} storySlug={slug} currentChapter={null} />
                </motion.div>

                {/* Comments */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="mb-8 sm:mb-12"
                >
                  <div className="flex flex-col gap-2 mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold">Story Comments</h2>
                    <p className="text-sm text-muted-foreground">
                      Share your thoughts about the story as a whole. For chapter-specific comments, please use the comment section available in each chapter.
                    </p>
                  </div>
                  <CommentSection storyId={story.id} />
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Support the Author Section - Only shown when monetization is enabled and not viewing own story */}
          {author?.donationsEnabled && user?.id !== author.id && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mb-8 sm:mb-12 bg-muted/30 rounded-lg p-4 sm:p-6 text-center"
            >
              {!story.isOriginal ? (
                <div className="py-2">
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    ❤️ Want to support this author?
                  </p>
                  <Link
                    href={`/user/${author.username}`}
                    className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                  >
                    Visit their profile →
                  </Link>
                </div>
              ) : author.donationLink ? (
                <>
                  <h2 className="text-lg sm:text-xl font-bold mb-2">Support the Author</h2>
                  <p className="text-muted-foreground mb-4 text-sm sm:text-base">
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
                </>
              ) : null}
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}
