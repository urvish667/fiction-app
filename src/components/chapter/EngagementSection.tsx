"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Heart, Share2, Bell, MessageCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import CommentSection from "@/components/comment-section"
import { SupportButton } from "@/components/SupportButton"
import StoryRecommendations from "@/components/StoryRecommendations"
import { StoryService } from "@/services/story-service"
import { Story, Chapter } from "@/types/story"
import { logError } from "@/lib/error-logger"

interface EngagementSectionProps {
  story: Story
  chapter?: Chapter
  slug: string
  chapterNumber: number
  isChapterLiked?: boolean
  isFollowing: boolean
  setIsChapterLiked?: (value: boolean) => void
  setIsFollowing: (value: boolean) => void
}

export function EngagementSection({
  story,
  chapter,
  slug,
  chapterNumber,
  isChapterLiked = false,
  isFollowing,
  setIsChapterLiked,
  setIsFollowing
}: EngagementSectionProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [showChapterComments, setShowChapterComments] = useState(false)
  const [chapterLikeLoading, setChapterLikeLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)



  // Handle like/unlike chapter
  const handleChapterLike = async () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like this chapter",
        variant: "default",
        action: (
          <Button variant="default" size="sm" onClick={() => router.push(`/login?callbackUrl=/story/${slug}/chapter/${chapterNumber}`)}>
            Sign in
          </Button>
        ),
      })
      return
    }

    if (!story || !chapter) return;

    try {
      setChapterLikeLoading(true)

      if (isChapterLiked) {
        await StoryService.unlikeChapter(story.id, chapter.id)
      } else {
        await StoryService.likeChapter(story.id, chapter.id)
      }

      // Toggle like status locally
      if (setIsChapterLiked) {
        setIsChapterLiked(!isChapterLiked)
      }
    } catch (err) {
      logError(err, { context: "Error updating chapter like status", chapterId: chapter?.id, userId: session?.user?.id })

      // Extract error message if available
      let errorMessage = "Failed to update chapter like status";
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setChapterLikeLoading(false)
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
      logError(err, { context: "Error updating follow status", authorId: story?.author?.id, userId: session?.user?.id })
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      })
    } finally {
      setFollowLoading(false)
    }
  }

  // Handle share functionality
  const handleShare = (platform: string) => {
    if (!story) return;

    const url = `${window.location.origin}/story/${slug}/chapter/${chapterNumber}`;
    const title = `${story.title}`;
    const text = `Check out "${story.title}"`;

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
          logError(err, { context: "Error copying link", url })
          toast({
            title: "Copy failed",
            description: "Failed to copy link to clipboard",
            variant: "destructive"
          });
        });
        break;
    }
  };

  return (
    <div className="border-t pt-6 sm:pt-8 mb-8 sm:mb-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Chapter Like Button - Only show if chapter is provided */}
          {chapter && (
            <Button
              variant={isChapterLiked ? "default" : "outline"}
              size="sm"
              onClick={handleChapterLike}
              disabled={chapterLikeLoading}
              className="flex items-center gap-1 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
              title={!session ? "Sign in to like this chapter" : undefined}
            >
              {chapterLikeLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-current"></div>
              ) : (
                <Heart size={14} className={isChapterLiked ? "fill-current" : ""} />
              )}
              <span className="hidden xs:inline">
                {isChapterLiked ? "Liked Chapter" : "Like Chapter"}
              </span>
              <span className="xs:hidden">
                {isChapterLiked ? "Liked" : "Like"}
              </span>
            </Button>
          )}

          {/* Chapter Comments Button - Only show if chapter is provided */}
          {chapter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowChapterComments(!showChapterComments)
              }}
              className="flex items-center gap-1 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
            >
              <MessageCircle size={14} />
              <span className="hidden xs:inline">Chapter Comments</span>
              <span className="xs:hidden">Comments</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4">
                <Share2 size={14} />
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
            className="flex items-center gap-1 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 w-full sm:w-auto"
          >
            {followLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-current"></div>
            ) : (
              <Bell size={14} />
            )}
            <span className="hidden sm:inline">
              {isFollowing ? "Following Author" : "Follow Author"}
            </span>
            <span className="sm:hidden">
              {isFollowing ? "Following" : "Follow"}
            </span>
          </Button>
        ) : null}
      </div>



      {/* Chapter Comments Section (Conditionally Rendered) */}
      <AnimatePresence>
        {showChapterComments && chapter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 sm:mb-12"
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Chapter Comments</h2>
            <CommentSection
              storyId={story.id}
              chapterId={chapter.id}
              isChapterComment={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support the Author Section - Only shown when monetization is enabled and user is not the author */}
      {story.author && typeof story.author === 'object' && story.author.donationsEnabled &&
       session && session.user.id !== story.author.id && (
        <div className="bg-muted/30 rounded-lg p-4 sm:p-6 text-center mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl font-bold mb-2">Support the Author</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            If you enjoyed this chapter, consider supporting the author to help them create more amazing content.
          </p>
          <SupportButton
            authorId={story.author.id}
            donationMethod={story.author.donationMethod ?? null}
            donationLink={story.author.donationLink ?? null}
            authorName={story.author.name || story.author.username || 'Author'}
            authorUsername={story.author.username || undefined}
          />
        </div>
      )}

      {/* Story Recommendations - You Might Also Like */}
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
