import type { Story, Chapter } from "@/types/story"

export interface ChapterState {
  story: Story | null
  chapter: Chapter | null
  chapters: Chapter[]
  isLoading: boolean
  isContentLoading: boolean
  error: string | null
  readingProgress: number
  isChapterLiked: boolean
  isFollowing: boolean
  contentLength: "short" | "medium" | "long"
  fontSize: number
}

export interface ChapterPageClientProps {
  initialStory: Story
  initialChapter: Chapter & { progress?: number }
  initialChapters: Chapter[]
  slug: string
  chapterNumber: number
}

export interface ChapterContentProps {
  chapter: Chapter
  story: Story
  contentLength: "short" | "medium" | "long"
  fontSize: number
  handleCopyAttempt: (e: React.ClipboardEvent | React.MouseEvent) => void
  contentRef: React.RefObject<HTMLDivElement | null>
  isContentLoading?: boolean
}

export interface ChapterHeaderProps {
  story: Story
  chapter: Chapter
  formatDate: (date: Date | string) => string
}

export interface ChapterNavigationProps {
  chapters: Chapter[]
  currentChapter: Chapter
  storySlug: string
  navigateToChapter: (direction: "prev" | "next") => void
}

export interface TopNavigationProps {
  slug: string
  chapters: Chapter[]
  currentChapter: Chapter
  fontSize: number
  adjustFontSize: (amount: number) => void
  handleBackToStory: () => void
  navigateToChapter: (direction: "prev" | "next") => void
}

export interface EngagementSectionProps {
  story: Story
  chapter?: Chapter
  slug: string
  chapterNumber: number
  isChapterLiked?: boolean
  isFollowing: boolean
  setIsChapterLiked?: (value: boolean) => void
  setIsFollowing: (value: boolean) => void
}
