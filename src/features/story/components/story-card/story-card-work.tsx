"use client"

import type React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Heart,
  BookOpen,
  Eye,
  MoreVertical,
  Trash2,
  PenSquare,
  MessageSquare,
} from "lucide-react"
import { formatStatNumber } from "@/utils/number-utils"
import { cn } from "@/lib/utils"
import {
  type StoryCardData,
  getGenreName,
  getImageUrl,
} from "./story-card.types"

export function PortraitWorkCard({
  story,
  onEdit,
  onDelete,
  onView,
}: {
  story: StoryCardData
  onEdit?: (id: string) => void
  onDelete?: (story: { id: string; title: string }) => void
  onView?: (id: string, slug?: string) => void
}) {
  const genreName = getGenreName(story.genre)
  const imageUrl = getImageUrl(story.coverImage)
  const isDraft = story.status === "draft"
  const storyId = String(story.id)
  const storySlug = story.slug || storyId

  const publishedCount = story.publishedChapters || 0
  const scheduledCount = story.scheduledChapters || 0
  const draftCount = story.draftChapters || 0

  return (
    <div className="group flex flex-col h-full">
      {/* Cover Image — 2:3 portrait ratio, matching Browse card layout */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl mb-2.5 shadow-sm bg-muted">
        <Image
          src={imageUrl}
          alt={story.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = "/placeholder.svg"
          }}
          unoptimized
        />

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top left badge: Genre */}
        <Badge className="absolute top-2 left-2 text-xs font-medium bg-black/60 text-white border-0 backdrop-blur-sm">
          {genreName}
        </Badge>

        {/* Top right badges: 18+ and Status */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {story.isMature && (
            <Badge className="bg-red-600 text-white font-bold text-[10px] px-1.5 py-0.5 border-0">
              18+
            </Badge>
          )}
          {isDraft ? (
            <Badge className="bg-amber-500/90 text-white border-0 text-xs backdrop-blur-sm">
              Draft
            </Badge>
          ) : (
            <Badge
              className={cn(
                "text-white border-0 text-xs backdrop-blur-sm",
                story.status === "completed" ? "bg-emerald-600/90" : "bg-purple-600/90"
              )}
            >
              {story.status === "completed" ? "Completed" : "Ongoing"}
            </Badge>
          )}
        </div>
      </div>

      {/* Info Section below cover image */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Title + Options Dropdown */}
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-serif font-bold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {story.title}
          </h3>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-1 -mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(storyId)
                }}
              >
                <PenSquare className="h-4 w-4 mr-2" />
                Edit Story
              </DropdownMenuItem>
              {!isDraft && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onView?.(storyId, storySlug)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Story
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.({ id: storyId, title: story.title })
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Chapter Breakdown info row */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 flex-wrap">
          <span className="flex items-center gap-1">
            <BookOpen size={11} />
            {publishedCount} {publishedCount === 1 ? "ch" : "chs"}
          </span>
          {scheduledCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              • {scheduledCount} scheduled
            </span>
          )}
          {draftCount > 0 && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              • {draftCount} draft{draftCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Stats Row (Views, Likes, Comments) */}
        {!isDraft && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2.5">
            <span className="flex items-center gap-1" title="Views">
              <Eye size={11} />
              {formatStatNumber(story.viewCount || 0)}
            </span>
            <span className="flex items-center gap-1" title="Likes">
              <Heart size={11} />
              {formatStatNumber(story.likeCount || 0)}
            </span>
            <span className="flex items-center gap-1" title="Comments">
              <MessageSquare size={11} />
              {formatStatNumber(story.commentCount || 0)}
            </span>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="mt-auto pt-1 flex gap-1.5">
          {isDraft ? (
            <Button
              size="sm"
              className="w-full text-xs h-8"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(storyId)
              }}
            >
              <PenSquare className="h-3.5 w-3.5 mr-1.5" />
              Continue Writing
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 px-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onView?.(storyId, storySlug)
                }}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs h-8 px-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(storyId)
                }}
              >
                <PenSquare className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
