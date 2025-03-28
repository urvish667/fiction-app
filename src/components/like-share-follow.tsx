"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Share2, Bell, Twitter, Facebook, LinkIcon, Check } from "lucide-react"
import type { Story } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LikeShareFollowProps {
  story: Story
}

export default function LikeShareFollow({ story }: LikeShareFollowProps) {
  const [liked, setLiked] = useState(false)
  const [following, setFollowing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleLike = () => {
    setLiked(!liked)
    if (!liked) {
      toast({
        title: "Story Liked",
        description: `You've liked "${story.title}"`,
      })
    }
  }

  const handleFollow = () => {
    setFollowing(!following)
    toast({
      title: following ? "Unfollowed Author" : "Following Author",
      description: following
        ? `You've unfollowed ${story.author}`
        : `You'll be notified when ${story.author} publishes new content`,
    })
  }

  const handleCopyLink = () => {
    // In a real app, this would copy the actual URL
    navigator.clipboard.writeText(`https://fablespace.com/story/${story.id}`)
    setCopied(true)

    toast({
      title: "Link Copied",
      description: "Story link copied to clipboard",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform: string) => {
    // In a real app, this would open the sharing dialog for the respective platform
    toast({
      title: "Sharing",
      description: `Sharing to ${platform}...`,
    })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={liked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              className="flex items-center gap-2"
            >
              <Heart size={16} className={liked ? "fill-white" : ""} />
              {liked ? "Liked" : "Like"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{liked ? "Unlike this story" : "Like this story"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={following ? "default" : "outline"}
              size="sm"
              onClick={handleFollow}
              className="flex items-center gap-2"
            >
              <Bell size={16} />
              {following ? "Following" : "Follow Author"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{following ? "Unfollow this author" : "Follow this author for updates"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Share2 size={16} />
                  Share
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share this story</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShare("Twitter")}>
            <Twitter size={16} className="mr-2" />
            Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("Facebook")}>
            <Facebook size={16} className="mr-2" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check size={16} className="mr-2" />
                Copied!
              </>
            ) : (
              <>
                <LinkIcon size={16} className="mr-2" />
                Copy Link
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

