"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Heart,
  BookOpen,
  Bookmark,
  BookMarked,
  Clock,
  PenSquare,
  Eye,
  MoreVertical,
  Trash2,
  MessageSquare,
  Flame,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { formatStatNumber } from "@/utils/number-utils"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type StoryCardVariant =
  | "portrait-grid"    // Browse grid: tall 2:3 cover, compact stats (Wattpad-style)
  | "landscape-list"   // Browse list toggle: thumbnail left + rich info right (Webnovel-style)
  | "mini-horizontal"  // Homepage sidebars: small thumbnail + title only
  | "featured"         // Homepage hero: large cover + full metadata
  | "portrait-work"    // My Works: creator card with 2:3 cover, breakdown stats, actions, dropdown

export type StoryCardData = {
  id: string | number
  title: string
  author: string | { name?: string; username?: string }
  genre?: string | { name: string } | null
  coverImage?: string
  excerpt?: string
  description?: string
  likeCount?: number
  commentCount?: number
  viewCount?: number
  chapterCount?: number
  publishedChapters?: number
  scheduledChapters?: number
  draftChapters?: number
  lastEdited?: any
  wordCount?: number
  status?: string
  readTime?: number
  date?: Date
  createdAt?: Date
  updatedAt?: Date
  slug?: string
  isMature?: boolean
  isBookmarked?: boolean
  tags?: string[]
  [key: string]: any
}

interface StoryCardProps {
  story: StoryCardData
  variant?: StoryCardVariant
  showBookmark?: boolean
  showStats?: boolean
  overlayTitle?: boolean
  showTitle?: boolean
  isTopStory?: boolean
  onBookmark?: (id: string | number) => void
  onEdit?: (id: string) => void
  onDelete?: (story: { id: string; title: string }) => void
  onView?: (id: string, slug?: string) => void
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthorName(author: StoryCardData["author"]): string {
  if (typeof author === "object" && author !== null) {
    return author.name || author.username || "Unknown Author"
  }
  return author || "Unknown Author"
}

function getGenreName(genre: StoryCardData["genre"]): string {
  if (!genre) return "General"
  if (typeof genre === "object" && "name" in genre) return genre.name
  return genre as string
}

function getImageUrl(coverImage?: string): string {
  if (coverImage && coverImage.trim() !== "") return coverImage
  return "/placeholder.svg"
}

// ─── Portrait Grid Card (Wattpad style — 2:3 tall cover) ─────────────────────

function PortraitGridCard({
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
            <h3 className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2 text-white drop-shadow-md group-hover:text-primary-foreground transition-colors">
              {story.title}
            </h3>
          </div>
        )}
      </div>

      {/* Info — Title below story cover when NOT overlaid */}
      {!overlayTitle && showTitle && (
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
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

// ─── Landscape List Card (Webnovel style — thumbnail left + rich info right) ──

function LandscapeListCard({ story, showBookmark, onBookmark }: {
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
            <h3 className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
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

// ─── Mini Horizontal Card (homepage sidebars) ─────────────────────────────────

function MiniHorizontalCard({ story }: { story: StoryCardData }) {
  const imageUrl = getImageUrl(story.coverImage)
  const authorName = getAuthorName(story.author)

  return (
    <div className="group flex gap-3 items-center">
      <div className="relative w-10 aspect-[2/3] shrink-0 overflow-hidden rounded-md shadow-sm">
        <Image
          src={imageUrl}
          alt={story.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {story.title}
        </h4>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{authorName}</p>
      </div>
    </div>
  )
}

// ─── Featured Card (hero/spotlight sections) ──────────────────────────────────

function FeaturedCard({ story, showBookmark, onBookmark }: {
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
          <h3 className="text-white font-bold text-base leading-snug line-clamp-2 mb-1">
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

// ─── Format Date Helper ───────────────────────────────────────────────────────

function formatDate(dateValue: any): string {
  if (!dateValue) return "Unknown date"
  try {
    let date: Date
    if (dateValue instanceof Date) {
      date = dateValue
    } else if (typeof dateValue === "string") {
      date = new Date(dateValue)
    } else if (typeof dateValue === "object") {
      if (dateValue.$date) {
        date = new Date(dateValue.$date)
      } else if (dateValue._seconds) {
        date = new Date(dateValue._seconds * 1000)
      } else if (dateValue.toISOString) {
        date = new Date(dateValue.toISOString())
      } else {
        date = new Date(dateValue)
      }
    } else {
      date = new Date(dateValue)
    }
    if (isNaN(date.getTime())) return "Unknown date"
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  } catch {
    return "Unknown date"
  }
}

// ─── Portrait Work Card (My Works page creator card — 2:3 tall cover) ─────────

function PortraitWorkCard({
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
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
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

// ─── Main Exported Component ──────────────────────────────────────────────────

export default function StoryCard({
  story,
  variant = "portrait-grid",
  showBookmark = true,
  showStats = true,
  overlayTitle = false,
  showTitle = true,
  isTopStory = false,
  onBookmark,
  onEdit,
  onDelete,
  onView,
  className,
}: StoryCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    if (variant === "portrait-work") {
      onEdit?.(String(story.id))
      return
    }
    router.push(`/story/${story.slug || story.id}`)
  }

  const cardContent = (() => {
    switch (variant) {
      case "portrait-grid":
        return <PortraitGridCard story={story} showBookmark={showBookmark} showStats={showStats} overlayTitle={overlayTitle} showTitle={showTitle} isTopStory={isTopStory} onBookmark={onBookmark} />
      case "landscape-list":
        return <LandscapeListCard story={story} showBookmark={showBookmark} onBookmark={onBookmark} />
      case "mini-horizontal":
        return <MiniHorizontalCard story={story} />
      case "featured":
        return <FeaturedCard story={story} showBookmark={showBookmark} onBookmark={onBookmark} />
      case "portrait-work":
        return <PortraitWorkCard story={story} onEdit={onEdit} onDelete={onDelete} onView={onView} />
      default:
        return <PortraitGridCard story={story} showBookmark={showBookmark} showStats={showStats} overlayTitle={overlayTitle} showTitle={showTitle} isTopStory={isTopStory} onBookmark={onBookmark} />
    }
  })()

  return (
    <motion.div
      whileHover={{ y: variant === "landscape-list" ? 0 : -3 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={handleCardClick}
      className={cn("cursor-pointer h-full", className)}
    >
      {cardContent}
    </motion.div>
  )
}
