"use client"
import { motion } from "framer-motion"
import StoryCard from "@/components/story-card"
import StoryCardSkeleton from "@/components/story-card-skeleton"

type StoryItem = {
  id: string | number
  title: string
  author: any
  genre?: string | any
  coverImage?: string
  excerpt?: string
  description?: string
  likeCount?: number
  commentCount?: number
  viewCount?: number // Combined story + chapter views
  readTime?: number
  date?: Date
  createdAt?: Date
  updatedAt?: Date
  slug?: string
  [key: string]: any
}

interface StoryGridProps {
  stories: StoryItem[]
  viewMode: "grid" | "list"
  isLoading?: boolean
}

export default function StoryGrid({
  stories,
  viewMode,
  isLoading = false,
}: StoryGridProps) {
  const gridClass = `grid gap-6 ${
    viewMode === "grid"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid-cols-1"
  }`

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={`skeleton-${index}`}>
            <StoryCardSkeleton viewMode={viewMode} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div layout className={gridClass}>
      {stories.map((item) => (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <StoryCard story={item} viewMode={viewMode} />
        </motion.div>
      ))}
    </motion.div>
  )
}
