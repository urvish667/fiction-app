import type { StoryCardData } from "@/features/story"
import type { BrowseResult } from "@/lib/server/browse-data"

export type BrowseStory = StoryCardData & {
  language?: string
  status?: string
}

export interface TagOption {
  id: string
  name: string
  slug: string
}

export interface GenreOption {
  id: string
  name: string
  slug: string
}

export interface BrowseParams {
  genre?: string
  tag?: string
  tags?: string
  search?: string
  page?: string
  sortBy?: string
  status?: string
  language?: string
}

export interface BrowseContentProps {
  initialParams: BrowseParams
  initialData: BrowseResult
}

export interface FilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedGenres: string[]
  onGenreChange: (genres: string[]) => void
  selectedTags: string[]
  onTagChange: (tags: string[]) => void
  availableTags: TagOption[]
  selectedLanguage: string
  onLanguageChange: (language: string) => void
  storyStatus: "all" | "ongoing" | "completed"
  onStatusChange: (status: "all" | "ongoing" | "completed") => void
  sortBy: string
  onSortChange: (sort: string) => void
}

export interface CategoryDescriptionProps {
  genre: string
  totalStories?: number
  language?: string
  status?: string
}
