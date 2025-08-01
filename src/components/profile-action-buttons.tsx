"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, Share2, Check, Loader2 } from "lucide-react"
import { StoryService } from "@/services/story-service"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { logError } from "@/lib/error-logger"
import { useProfileCompletionHandler } from "@/lib/profile-completion-handler"
import { SupportButton } from "./SupportButton"

interface ProfileActionButtonsProps {
  username: string
  isCurrentUser: boolean
  author: {
    id: string;
    name: string;
    donationMethod: 'PAYPAL' | 'STRIPE' | 'BMC' | 'KOFI' | null;
    donationLink: string | null;
  }
}

export default function ProfileActionButtons({ username, isCurrentUser, author }: ProfileActionButtonsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { handleApiError } = useProfileCompletionHandler()
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  // Check if the current user is following this profile
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session || isCurrentUser) return

      try {
        const isFollowing = await StoryService.isFollowingUser(username)
        setIsFollowing(isFollowing)
      } catch (err) {
        logError(err, { context: "Error checking follow status", username })
      }
    }

    checkFollowStatus()
  }, [session, username, isCurrentUser])

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/user/${username}`)
      return
    }

    setFollowLoading(true)

    try {
      if (isFollowing) {
        await StoryService.unfollowUser(username)
        setIsFollowing(false)
        toast({
          title: "Unfollowed",
          description: `You are no longer following @${username}`
        })
      } else {
        await StoryService.followUser(username)
        setIsFollowing(true)
        toast({
          title: "Following",
          description: `You are now following @${username}`
        })
      }
    } catch (err: any) {
      // Check if it's a profile incomplete error
      if (handleApiError(err, `/user/${username}`)) {
        // Error was handled by profile completion handler
        return
      }

      logError(err, { context: "Error updating follow status", username })
      toast({
        title: "Error",
        description: err.message || "Failed to update follow status. Please try again.",
        variant: "destructive"
      })
    } finally {
      setFollowLoading(false)
    }
  }

  // Handle share profile
  const handleShare = async () => {
    setShareLoading(true)

    try {
      // Get the current URL or construct the profile URL
      let profileUrl = '';
      if (typeof window !== 'undefined') {
        profileUrl = window.location.href;
      }

      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)

      toast({
        title: "Link Copied",
        description: "Profile link copied to clipboard"
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      logError(err, { context: "Error sharing profile", username })
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShareLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Support Button */}
      {!isCurrentUser && author.donationMethod && author.donationLink && (
        <SupportButton
          authorId={author.id}
          authorName={author.name}
          authorUsername={username}
          donationMethod={author.donationMethod}
          donationLink={author.donationLink}
        />
      )}

      {/* Don't show follow button for own profile */}
      {!isCurrentUser && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isFollowing ? "default" : "outline"}
                size="icon"
                className="rounded-full h-10 w-10"
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isFollowing ? (
                  <UserCheck className="h-5 w-5" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFollowing ? "Unfollow" : "Follow"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10"
              onClick={handleShare}
              disabled={shareLoading}
            >
              {shareLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Share2 className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share Profile</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
