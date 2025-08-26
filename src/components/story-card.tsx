"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageSquare, Share2, Eye } from "lucide-react"
import Image from "next/image"
import { formatStatNumber } from "@/utils/number-utils"
// Using a more flexible type to handle both mock and API data
type StoryCardProps = {
  story: {
    id: string | number
    title: string
    author: string | { name?: string; username?: string }
    genre?: string
    coverImage?: string
    excerpt?: string
    description?: string
    likeCount?: number
    commentCount?: number
    viewCount?: number // Combined story + chapter views
    readTime?: number
    date?: Date
    createdAt?: Date
    updatedAt?: Date
    slug?: string
    isMature?: boolean
  }
  viewMode?: "grid" | "list"
}
// Import useState if needed in the future
// import { useState } from "react"
import { useRouter } from "next/navigation"



export default function StoryCard({ story, viewMode = "grid" }: StoryCardProps) {
  // Use story's like status for display only
  const liked = (story as any).isLiked || false
  // Use the standardized fields
  const likeCount = story.likeCount || 0
  const router = useRouter()

  const isGrid = viewMode === "grid"

  // Use coverImage as the standard field
  const imageUrl = (story.coverImage && story.coverImage.trim() !== "") ?
    story.coverImage :
    "/placeholder.svg"

  // Image URL is now properly handled without logging

  const formatDate = (date?: Date | string) => {
    if (!date) return "";

    try {
      // Convert string dates to Date objects
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return "";
      }

      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(dateObj);
    } catch (error) {
      return "";
    }
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
      className="cursor-pointer h-full"
    >
      <Card className={`overflow-hidden flex ${isGrid ? "flex-col" : "flex-row"} h-full`}>
        <div className={`${isGrid ? "w-full" : "w-1/3"} relative`}>
          <div className={`relative ${isGrid ? "aspect-[3/2]" : "h-full min-h-[180px]"} overflow-hidden`}>
            <Image
              src={imageUrl}
              alt={story.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              onError={(e) => {
                // @ts-ignore - setting src on error
                e.target.src = "/placeholder.svg";
              }}
              unoptimized={true} // Skip Next.js image optimization for external URLs
            />

            {/* 18+ Tag for mature content */}
            {story.isMature && (
              <Badge className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-2 py-1 z-10">
                18+
              </Badge>
            )}
            <Badge className="absolute top-2 right-2">
              {typeof story.genre === 'object' && story.genre !== null
                ? (story.genre as { name: string }).name
                : (typeof story.genre === 'string' ? story.genre : 'General')}
            </Badge>
          </div>
        </div>

        <div className={`${isGrid ? "w-full" : "w-2/3"} flex flex-col h-full`}>
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg line-clamp-1">{story.title}</h3>
                <p className="text-sm">
                  by <span className="font-medium hover:text-primary transition-colors">
                    {typeof story.author === 'object' ?
                      (story.author?.name || story.author?.username || "Unknown Author") :
                      story.author}
                  </span>
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{formatDate(story.date || story.createdAt)}</span>
            </div>
          </CardHeader>

          <CardContent className="pb-1 pt-0 px-4 flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3 w-full">{story.excerpt || story.description || "No description available."}</p>
          </CardContent>

          <CardFooter className="pt-0 pb-2 px-4 flex justify-between mt-auto">
            <div className="flex items-center gap-4">
              {/* Views Stats */}
              <div className="flex items-center gap-1">
                <Eye size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatStatNumber(story.viewCount || 0)}
                </span>
              </div>

              {/* Likes Stats */}
              <div className="flex items-center gap-1">
                <Heart
                  size={16}
                  className={`${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                />
                <span className="text-sm text-muted-foreground">{formatStatNumber(likeCount)}</span>
              </div>

              {/* Comments Stats */}
              <div className="flex items-center gap-1">
                <MessageSquare size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{formatStatNumber(story.commentCount || 0)}</span>
              </div>
            </div>

            {/* Share Button */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={handleActionClick}
              title="Share"
            >
              <Share2 size={16} className="text-muted-foreground" />
            </Button>
          </CardFooter>
        </div>
      </Card>
    </motion.div>
  )
}

