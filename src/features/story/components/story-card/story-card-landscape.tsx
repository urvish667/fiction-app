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

export function LandscapeListCard({
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
    <div className="group flex gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-xl border border-border/50 hover:border-border hover:bg-accent/30 transition-all duration-200 h-full items-start">
      {/* Thumbnail — strictly 2:3 portrait aspect ratio */}
      <div className="relative w-24 sm:w-28 aspect-[2/3] shrink-0 overflow-hidden rounded-lg shadow-sm self-start">
        <Image
          src={imageUrl}
          alt={story.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
          unoptimized
        />
        {story.isMature && (
          <Badge className="absolute top-1 left-1 bg-red-600 text-white border-0 text-[9px] px-1 py-0 z-10">
            18+
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0 h-full justify-between py-0.5">
        <div>
          {/* Title + Bookmark */}
          <div className="flex items-start justify-between gap-1.5 mb-0.5">
            <h3 className="font-serif font-bold text-xs sm:text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {story.title}
            </h3>
            {showBookmark && (
              <button
                onClick={handleBookmark}
                className={cn(
                  "shrink-0 p-1 rounded-md transition-all duration-200 hover:bg-muted -mt-0.5 -mr-0.5",
                  isBookmarked ? "text-primary" : "text-muted-foreground"
                )}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark story"}
              >
                {isBookmarked ? <BookMarked size={15} /> : <Bookmark size={15} />}
              </button>
            )}
          </div>

          {/* Author */}
          <p className="text-[11px] sm:text-xs text-muted-foreground mb-1 truncate">
            by <span className="hover:text-foreground transition-colors">{authorName}</span>
          </p>

          {/* Excerpt/Description — 2 lines */}
          <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
            {story.excerpt || story.description || "No description available."}
          </p>
        </div>

        {/* Footer — genre badge + stats cleanly aligned */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1.5 border-t border-border/30 sm:border-t-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 font-normal truncate max-w-[90px] sm:max-w-none">
              {genreName}
            </Badge>
            {story.status === "completed" && (
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 text-emerald-600 border-emerald-600/30 shrink-0">
                Completed
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-[11px] sm:text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Heart size={12} className={cn(story.isLiked ? "fill-red-500 text-red-500" : "")} />
              {formatStatNumber(story.likeCount || 0)}
            </span>
            {story.chapterCount !== undefined && (
              <span className="flex items-center gap-0.5 sm:gap-1">
                <BookOpen size={12} />
                {story.chapterCount} ch
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
