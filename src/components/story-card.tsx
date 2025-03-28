"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageSquare, Bookmark, Share2 } from "lucide-react"
import Image from "next/image"
import type { Story } from "@/lib/types"
import { useState } from "react"
// Update the StoryCard component to make it clickable and navigate to the story page
// Add the useRouter import at the top
import { useRouter } from "next/navigation"

interface StoryCardProps {
  story: Story
  viewMode?: "grid" | "list"
}

// In the StoryCard component, add the router and handleClick function
export default function StoryCard({ story, viewMode = "grid" }: StoryCardProps) {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const router = useRouter()

  const isGrid = viewMode === "grid"

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // Navigate to story page when card is clicked
  const handleCardClick = () => {
    router.push(`/story/${story.id}`)
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
      <Card className={`h-full overflow-hidden flex ${isGrid ? "flex-col" : "flex-row"}`}>
        <div className={`${isGrid ? "w-full" : "w-1/3"} relative`}>
          <div className={`relative ${isGrid ? "aspect-[3/2]" : "h-full"} overflow-hidden`}>
            <Image
              src={story.thumbnail || "/placeholder.svg"}
              alt={story.title}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
            <Badge className="absolute top-2 right-2">{story.genre}</Badge>
          </div>
        </div>

        <div className={`${isGrid ? "w-full" : "w-2/3"} flex flex-col`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg line-clamp-1">{story.title}</h3>
                <p className="text-sm text-muted-foreground">by {story.author}</p>
              </div>
              <span className="text-xs text-muted-foreground">{formatDate(story.date)}</span>
            </div>
          </CardHeader>

          <CardContent className="pb-2 flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">{story.excerpt}</p>
          </CardContent>

          <CardFooter className="pt-0 flex justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  handleActionClick(e)
                  setLiked(!liked)
                }}
              >
                <Heart size={16} className={liked ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                <span className="sr-only">Like</span>
              </Button>
              <span className="text-sm text-muted-foreground">{liked ? story.likes + 1 : story.likes}</span>

              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleActionClick}>
                <MessageSquare size={16} className="text-muted-foreground" />
                <span className="sr-only">Comments</span>
              </Button>
              <span className="text-sm text-muted-foreground">{story.comments}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  handleActionClick(e)
                  setBookmarked(!bookmarked)
                }}
              >
                <Bookmark size={16} className={bookmarked ? "fill-primary text-primary" : "text-muted-foreground"} />
                <span className="sr-only">Bookmark</span>
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

