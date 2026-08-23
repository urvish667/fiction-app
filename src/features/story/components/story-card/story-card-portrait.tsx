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

export function PortraitGridCard({
  story,
  showBookmark,
  showStats = true,
  overlayTitle = false,
  showTitle = true,
  isTopStory = false,
  onBookmark,
}: {
  story: StoryCardData
  showBookmark: boolean
  showStats?: boolean
  overlayTitle?: boolean
  showTitle?: boolean
  isTopStory?: boolean
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
    <div className="group flex flex-col h-full rounded-xl overflow-hidden">
      {/* Cover Image — 2:3 portrait ratio */}
      <div className={cn("relative aspect-[2/3] overflow-hidden rounded-xl shadow-sm", overlayTitle ? "mb-0" : "mb-2.5")}>
        <Image
          src={imageUrl}
          alt={story.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
          unoptimized
        />

        {/* Gradient overlay */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-300 pointer-events-none",
            overlayTitle
              ? "bg-gradient-to-t from-black/85 via-black/25 to-transparent"
              : "bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100"
          )}
        />

        {/* Genre badge — top left */}
        <Badge className="absolute top-2 left-2 text-xs font-medium bg-black/60 text-white border-0 backdrop-blur-sm z-10">
          {genreName}
        </Badge>

        {/* 18+ badge — top right */}
        {story.isMature && (
          <Badge className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-1.5 py-0.5 border-0 z-10">
            18+
          </Badge>
        )}

        {/* Status badge (Completed / Ongoing) — shown when title is NOT overlaid */}
        {story.status === "completed" && !overlayTitle && (
          <Badge className="absolute bottom-2 left-2 bg-emerald-600/90 text-white border-0 text-xs backdrop-blur-sm">
            Completed
          </Badge>
        )}

        {/* Bookmark button — overlay on hover */}
        {showBookmark && (
          <button
            onClick={handleBookmark}
            className={cn(
              "absolute bottom-2 right-2 p-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 z-10",
              "opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0",
              isBookmarked
                ? "bg-primary text-white"
                : "bg-black/50 text-white hover:bg-primary"
            )}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark story"}
          >
            {isBookmarked ? <BookMarked size={14} /> : <Bookmark size={14} />}
          </button>
        )}

        {/* Title over cover thumbnail at bottom side */}
        {overlayTitle && showTitle && (
          <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 text-white z-10">
            {story.status === "completed" && (
              <Badge className="mb-1 bg-emerald-600/90 text-white border-0 text-[10px] px-1.5 py-0 backdrop-blur-sm">
                Completed
              </Badge>
            )}
            <h3 className="font-serif font-bold text-xs sm:text-sm leading-snug line-clamp-2 text-white drop-shadow-md group-hover:text-primary-foreground transition-colors">
              {story.title}
            </h3>
          </div>
        )}
      </div>

      {/* Info — Title below story cover when NOT overlaid */}
      {!overlayTitle && showTitle && (
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="font-serif font-bold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
            {story.title}
          </h3>
          {showStats && (
            <>
              <p className="text-xs text-muted-foreground mb-2 truncate mt-0.5">
                by <span className="hover:text-foreground transition-colors">{authorName}</span>
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-auto">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart size={11} className={cn(story.isLiked ? "fill-red-500 text-red-500" : "")} />
                  {formatStatNumber(story.likeCount || 0)}
                </span>
                {story.chapterCount !== undefined && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BookOpen size={11} />
                    {story.chapterCount} ch
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
