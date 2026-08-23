import { BlogPost, BlogCategory } from "@/types/blog"

export type { BlogPost }
export { BlogCategory }

export interface BlogCardProps {
  post: BlogPost
  viewMode?: "grid" | "list"
}

export interface BlogGridProps {
  posts: BlogPost[]
  viewMode: "grid" | "list"
}

export interface BlogFiltersProps {
  categories: string[]
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
  onClearFilters: () => void
}

export interface BlogFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  categories: string[]
  selectedCategories: string[]
  onCategoryChange: (categories: string[]) => void
}

export interface BlogContentProps {
  initialBlogs: BlogPost[]
}

export interface BlogLoadingProps {
  gridClassName?: string
  viewMode?: "grid" | "list"
}
