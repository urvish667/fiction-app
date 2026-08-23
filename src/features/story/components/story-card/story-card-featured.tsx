"use client"

import type React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Heart, BookOpen, Bookmark, BookMarked } from "lucide-react"
import { formatStatNumber } from "@/utils/number-utils"
import { cn } from "@/lib/utils"
import {
  type StoryCardData,
  getAuthorName,
  getGenreName,
  getImageUrl,
} from "./story-card.types"

export function FeaturedCard({
  story,
  showBookmark,
  onBookmark,
}: {
  story: StoryCardData
  showBookmark: boolean
  onBookmark?: (id: string | number) => void
}) {
  const genreName = getGenreName(story.genre)
  const imageUrl = getImageUrl(story.coverImage)
  const authorName = getAuthorName(story.author)
  const isBookmarked = story.isBookmarked || false

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    onBookmark?.(story.id)
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300">
      {/* Large cover */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={story.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
          unoptimized
        />
        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm text-xs">{genreName}</Badge>
          {story.isMature && (
            <Badge className="bg-red-600 text-white border-0 text-xs">18+</Badge>
          )}
        </div>

        {/* Info overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-serif font-bold text-white text-base leading-snug line-clamp-2 mb-1">
            {story.title}
          </h3>
          <p className="text-white/70 text-xs mb-3">by {authorName}</p>

          <p className="text-white/60 text-xs line-clamp-2 mb-3 leading-relaxed">
            {story.excerpt || story.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white/70 text-xs">
              <span className="flex items-center gap-1">
                <Heart size={12} className={cn(story.isLiked ? "fill-red-400 text-red-400" : "")} />
                {formatStatNumber(story.likeCount || 0)}
              </span>
              {story.chapterCount !== undefined && (
                <span className="flex items-center gap-1">
                  <BookOpen size={12} />
                  {story.chapterCount} ch
                </span>
              )}
            </div>

            {showBookmark && (
              <button
                onClick={handleBookmark}
                className={cn(
                  "p-1.5 rounded-lg backdrop-blur-sm transition-all duration-200",
                  isBookmarked
                    ? "bg-primary text-white"
                    : "bg-white/20 text-white hover:bg-primary"
                )}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark story"}
              >
                {isBookmarked ? <BookMarked size={13} /> : <Bookmark size={13} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
