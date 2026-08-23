"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Share2, MessageCircle, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { CommentSection } from "@/features/comments"
import { SupportButton, StoryRecommendations } from "@/features/story"
import { StoryService } from "@/lib/api/story"
import { ChapterService } from "@/lib/api/chapter"
import { logError } from "@/lib/error-logger"
import type { EngagementSectionProps } from "../types/reader.types"

export function EngagementSection({
  story,
  chapter,
  slug,
  chapterNumber,
  isChapterLiked = false,
  isFollowing,
  setIsChapterLiked,
  setIsFollowing,
}: EngagementSectionProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [showChapterComments, setShowChapterComments] = useState(false)
  const [chapterLikeLoading, setChapterLikeLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // ── Handle Chapter Like / Unlike ─────────────────────────────────────────
  const handleChapterLike = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like this chapter",
        action: (
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push(`/login?callbackUrl=/story/${slug}/chapter/${chapterNumber}`)}
          >
            Sign in
          </Button>
        ),
      })
      return
    }

    if (!story || !chapter) return

    setChapterLikeLoading(true)

    try {
      const response = isChapterLiked
        ? await ChapterService.unlikeChapter(chapter.id)
        : await ChapterService.likeChapter(chapter.id)

      if (!response.success) {
        throw new Error(response.message || "Failed to update chapter like status")
      }

      setIsChapterLiked?.(!isChapterLiked)
    } catch (err) {
      logError(err, { context: "Error updating chapter like status", chapterId: chapter.id, userId: user?.id })
      const message = err instanceof Error ? err.message : "Failed to update chapter like status"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setChapterLikeLoading(false)
    }
  }

  // ── Handle Follow / Unfollow Author ─────────────────────────────────────
  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow this author",
        action: (
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push(`/login?callbackUrl=/story/${slug}/chapter/${chapterNumber}`)}
          >
            Sign in
          </Button>
        ),
      })
      return
    }

    if (!story?.author || typeof story.author !== "object") return
    if (story.author.id === user?.id || !story.author.username) return

    setFollowLoading(true)

    try {
      if (isFollowing) {
        await StoryService.unfollowUser(story.author.username)
        setIsFollowing?.(false)
      } else {
        await StoryService.followUser(story.author.username)
        setIsFollowing?.(true)
      }
    } catch (err) {
      logError(err, { context: "Error updating follow status", authorId: story.author?.id, userId: user?.id })
      toast({ title: "Error", description: "Failed to update follow status", variant: "destructive" })
    } finally {
      setFollowLoading(false)
    }
  }

  // ── Handle Social Share ──────────────────────────────────────────────────
  const handleShare = (platform: "twitter" | "facebook" | "copy") => {
    if (!story) return

    const url = `${window.location.origin}/story/${slug}/chapter/${chapterNumber}`
    const title = `${story.title}`
    const text = `Check out "${story.title}"`

    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}&title=${encodeURIComponent(title)}`,
        "_blank"
      )
      return
    }

    if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")
      return
    }

    if (platform === "copy") {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          toast({ title: "Link copied", description: "Chapter link copied to clipboard" })
        })
        .catch(err => {
          logError(err, { context: "Error copying link", url })
          toast({ title: "Copy failed", description: "Failed to copy link to clipboard", variant: "destructive" })
        })
    }
  }

  return (
    <div className="border-t pt-6 sm:pt-8 mb-8 sm:mb-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Chapter Like Button */}
          {chapter && (
            <Button
              variant={isChapterLiked ? "default" : "outline"}
              size="icon"
              onClick={handleChapterLike}
              disabled={chapterLikeLoading}
              className="rounded-full h-9 w-9"
              title={!isAuthenticated ? "Sign in to like this chapter" : isChapterLiked ? "Unlike chapter" : "Like chapter"}
            >
              {chapterLikeLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-current" />
              ) : (
                <Heart size={14} className={isChapterLiked ? "fill-current" : ""} />
              )}
            </Button>
          )}

          {/* Chapter Comments Button */}
          {chapter && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowChapterComments(prev => !prev)}
              className="rounded-full h-9 w-9"
              title="Chapter comments"
            >
              <MessageCircle size={14} />
            </Button>
          )}

          {/* Share Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9"
                title="Share"
              >
                <Share2 size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleShare("twitter")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
                Twitter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("facebook")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare("copy")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Follow Author Button (hidden for story owner) */}
        {Boolean(
          isAuthenticated &&
          user &&
          story?.author &&
          typeof story.author === "object" &&
          user.id !== story.author.id
        ) && (
          <Button
            variant={isFollowing ? "default" : "outline"}
            size="icon"
            onClick={handleFollow}
            disabled={followLoading}
            className="rounded-full h-9 w-9"
            title={isFollowing ? "Unfollow author" : "Follow author"}
          >
            {followLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-current" />
            ) : (
              <UserPlus size={14} />
            )}
          </Button>
        )}
      </div>

      {/* Chapter Comments Section */}
      <AnimatePresence>
        {showChapterComments && chapter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 sm:mb-12"
          >
            <div className="flex flex-col gap-2 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">Chapter Comments</h2>
              <p className="text-sm text-muted-foreground">
                Discuss this specific chapter. For general story feedback, please use the comments section on the main story page.
              </p>
            </div>
            <CommentSection
              storyId={story.id}
              chapterId={chapter.id}
              isChapterComment={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support Author Card */}
      {(() => {
        const author = story?.author && typeof story.author === "object" ? story.author : null
        const canSupport = Boolean(author?.donationsEnabled && isAuthenticated && user && user.id !== author.id)
        if (!canSupport || !author) return null

        return (
          <div className="bg-muted/30 rounded-lg p-4 sm:p-6 text-center mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl font-bold mb-2">Support the Author</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              If you enjoyed this chapter, consider supporting the author to help them create more amazing content.
            </p>
            <SupportButton
              authorId={author.id}
              donationMethod={author.donationMethod ?? null}
              donationLink={author.donationLink ?? null}
              authorName={author.name || author.username || "Author"}
              authorUsername={author.username || undefined}
            />
          </div>
        )
      })()}

      {/* Story Recommendations */}
      <div className="mt-6 sm:mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">You Might Also Like</h2>
          <span className="text-xs sm:text-sm text-muted-foreground">
            Based on genre and tags
          </span>
        </div>
        <StoryRecommendations
          storyId={story.id}
          excludeSameAuthor={true}
          limit={6}
          className="mb-8 sm:mb-12"
        />
      </div>
    </div>
  )
}

export default EngagementSection
