import type React from "react"
import type { GenreSummary, TagSummary } from "@/types/story"

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
  genre?: string | GenreSummary | null
  coverImage?: string | null
  excerpt?: string
  description?: string
  likeCount?: number
  commentCount?: number
  viewCount?: number
  chapterCount?: number
  publishedChapters?: number
  scheduledChapters?: number
  draftChapters?: number
  lastEdited?: Date | string | null
  wordCount?: number
  status?: string
  readTime?: number
  date?: Date
  createdAt?: Date | string
  updatedAt?: Date | string
  slug?: string | null
  isMature?: boolean
  isBookmarked?: boolean
  isLiked?: boolean
  language?: string
  tags?: string[] | TagSummary[]
}

export interface StoryCardProps {
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

export function getAuthorName(author: StoryCardData["author"]): string {
  if (typeof author === "object" && author !== null) {
    return author.name || author.username || "Unknown Author"
  }
  return author || "Unknown Author"
}

export function getGenreName(genre?: string | GenreSummary | null): string {
  if (!genre) return "General"
  return typeof genre === "object" ? (genre.name ?? "General") : genre
}

export function getImageUrl(coverImage?: string | null): string {
  if (coverImage && coverImage.trim() !== "") return coverImage
  return "/placeholder.svg"
}

export function formatDate(dateValue: any): string {
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
