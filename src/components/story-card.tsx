"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageSquare, Bookmark, Share2 } from "lucide-react"
import Image from "next/image"
// Using a more flexible type to handle both mock and API data
type StoryCardProps = {
  story: {
    id: string | number
    title: string
    author: string | { name?: string; username?: string }
    genre?: string
    thumbnail?: string
    coverImage?: string
    excerpt?: string
    description?: string
    likes?: number
    likeCount?: number
    comments?: number
    commentCount?: number
    reads?: number
    readCount?: number
    readTime?: number
    date?: Date
    createdAt?: Date
    updatedAt?: Date
    slug?: string
  }
  viewMode?: "grid" | "list"
}
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { StoryService } from "@/services/story-service"



export default function StoryCard({ story, viewMode = "grid" }: StoryCardProps) {
  // Track like and bookmark states with initial values from story props
  const [liked, setLiked] = useState(story.isLiked || false)
  const [bookmarked, setBookmarked] = useState(story.isBookmarked || false)

  // Animation states for like and bookmark actions
  const [likeAnimation, setLikeAnimation] = useState(false)
  const [bookmarkAnimation, setBookmarkAnimation] = useState(false)
  const [likeCount, setLikeCount] = useState(story.likes || story.likeCount || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const isGrid = viewMode === "grid"

  // Ensure we have a valid image URL or use placeholder
  const imageUrl = (story.thumbnail && story.thumbnail.trim() !== "") ?
    story.thumbnail :
    (story.coverImage && story.coverImage.trim() !== "") ?
      story.coverImage :
      "/placeholder.svg"

  // Log image URL for debugging
  console.log(`Story card image for "${story.title}": ${imageUrl}`)

  const formatDate = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // Navigate to story page when card is clicked
  const handleCardClick = () => {
    // Use slug if available, otherwise use ID
    router.push(`/story/${story.slug || story.id}`)
  }

  // Prevent propagation for action buttons
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className="cursor-pointer"
    >
      <Card className={`h-full overflow-hidden flex ${isGrid ? "flex-col" : "flex-row"}`} style={{ height: isGrid ? '380px' : 'auto' }}>
        <div className={`${isGrid ? "w-full" : "w-1/3"} relative`}>
          <div className={`relative ${isGrid ? "aspect-[3/2]" : "h-full min-h-[180px]"} overflow-hidden`}>
            <Image
              src={imageUrl}
              alt={story.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              onError={(e) => {
                console.error("Image load error:", e);
                // @ts-ignore - setting src on error
                e.target.src = "/placeholder.svg";
              }}
              unoptimized={true} // Skip Next.js image optimization for external URLs
            />
            <Badge className="absolute top-2 right-2">{story.genre}</Badge>
          </div>
        </div>

        <div className={`${isGrid ? "w-full" : "w-2/3"} flex flex-col ${isGrid ? "justify-between" : ""}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg line-clamp-1">{story.title}</h3>
                <p className="text-sm text-muted-foreground">by {typeof story.author === 'object' ?
                  (story.author?.name || story.author?.username || "Unknown Author") :
                  story.author}</p>
              </div>
              <span className="text-xs text-muted-foreground">{formatDate(story.date || story.createdAt)}</span>
            </div>
          </CardHeader>

          <CardContent className="pb-2 flex-grow h-[60px] flex items-start">
            <p className="text-sm text-muted-foreground line-clamp-2 w-full">{story.excerpt || story.description || "No description available."}</p>
          </CardContent>

          <CardFooter className="pt-0 flex justify-between mt-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 relative group ${liked ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                disabled={isLiking}
                onClick={async (e) => {
                  handleActionClick(e)
                  if (!story.id) return

                  try {
                    setIsLiking(true)
                    if (liked) {
                      try {
                        await StoryService.unlikeStory(String(story.id))
                        setLikeCount(prev => Math.max(0, prev - 1))
                        setLiked(false)
                      } catch (unlikeError: any) {
                        // If there's an error unliking, just revert the UI state
                        console.log('Error unliking story, reverting UI state:', unlikeError.message)
                        // No UI update needed - will stay in liked state
                      }
                    } else {
                      // Trigger animation when liking
                      setLikeAnimation(true)
                      setTimeout(() => setLikeAnimation(false), 500)

                      try {
                        await StoryService.likeStory(String(story.id))
                        setLikeCount(prev => prev + 1)
                        setLiked(true)
                      } catch (likeError: any) {
                        // If there's an error (including "already liked"), just revert the UI state
                        console.log('Error liking story, reverting UI state:', likeError.message)
                        // No UI update needed - animation will revert naturally
                      }
                    }
                  } catch (error: any) {
                    console.error('Unexpected error toggling like:', error)
                    // Only show toast for unexpected errors
                    toast({
                      title: "Error",
                      description: "Something went wrong. Please try again later.",
                      variant: "destructive"
                    })
                  } finally {
                    setIsLiking(false)
                  }
                }}
              >
                <Heart
                  size={16}
                  className={`transition-colors duration-300 ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-400"} ${likeAnimation ? "scale-125" : ""}`}
                  style={{ transition: "transform 0.3s ease" }}
                />
                {isLiking && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary animate-ping"></span>}
                <span className="sr-only">{liked ? 'Unlike' : 'Like'}</span>
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">{liked ? 'Unlike' : 'Like'}</span>
              </Button>
              <span className="text-sm text-muted-foreground">{likeCount}</span>

              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleActionClick}>
                <MessageSquare size={16} className="text-muted-foreground" />
                <span className="sr-only">Comments</span>
              </Button>
              <span className="text-sm text-muted-foreground">{story.comments || story.commentCount || 0}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 relative group ${bookmarked ? 'bg-primary-50 dark:bg-primary-950/20' : ''}`}
                disabled={isBookmarking}
                onClick={async (e) => {
                  handleActionClick(e)
                  if (!story.id) return

                  try {
                    setIsBookmarking(true)
                    if (bookmarked) {
                      try {
                        await StoryService.removeBookmark(String(story.id))
                        setBookmarked(false)
                      } catch (unbookmarkError: any) {
                        // If there's an error removing bookmark, just revert the UI state
                        console.log('Error removing bookmark, reverting UI state:', unbookmarkError.message)
                        // No UI update needed - will stay in bookmarked state
                      }
                    } else {
                      // Trigger animation when bookmarking
                      setBookmarkAnimation(true)
                      setTimeout(() => setBookmarkAnimation(false), 500)

                      try {
                        await StoryService.bookmarkStory(String(story.id))
                        setBookmarked(true)
                      } catch (bookmarkError: any) {
                        // If there's an error (including "already bookmarked"), just revert the UI state
                        console.log('Error bookmarking story, reverting UI state:', bookmarkError.message)
                        // No UI update needed - animation will revert naturally
                      }
                    }
                  } catch (error) {
                    console.error('Unexpected error toggling bookmark:', error)
                    toast({
                      title: "Error",
                      description: "Something went wrong. Please try again later.",
                      variant: "destructive"
                    })
                  } finally {
                    setIsBookmarking(false)
                  }
                }}
              >
                <Bookmark
                  size={16}
                  className={`transition-colors duration-300 ${bookmarked ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary/70"} ${bookmarkAnimation ? "scale-125" : ""}`}
                  style={{ transition: "transform 0.3s ease" }}
                />
                {isBookmarking && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary animate-ping"></span>}
                <span className="sr-only">{bookmarked ? 'Remove bookmark' : 'Bookmark'}</span>
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">{bookmarked ? 'Remove bookmark' : 'Bookmark'}</span>
              </Button>

              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleActionClick}>
                <Share2 size={16} className="text-muted-foreground" />
                <span className="sr-only">Share</span>
              </Button>
            </div>
          </CardFooter>
        </div>
      </Card>
    </motion.div>
  )
}

