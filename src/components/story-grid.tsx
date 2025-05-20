"use client"
import { motion } from "framer-motion"
import StoryCard from "@/components/story-card"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import AdBanner from "@/components/ad-banner"

// Define a generic type for stories that matches what StoryCard expects
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
  showAds?: boolean
  isLoading?: boolean
}

export default function StoryGrid({ stories, viewMode, showAds = false, isLoading = false }: StoryGridProps) {

  // Define grid layout class based on view mode
  const gridClass = `grid gap-6 ${
    viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
  }`

  // Simplified approach: just insert ads after every 8 stories (2 rows on XL screens)
  // This ensures ads appear after complete rows on all screen sizes
  const simplifiedStoriesWithAds = showAds
    ? stories.reduce((acc: (StoryItem | { isAd: true })[], story, index) => {
        acc.push(story)
        if ((index + 1) % 8 === 0 && index !== stories.length - 1) {
          acc.push({ isAd: true })
        }
        return acc
      }, [])
    : stories

  // Use the simplified approach instead of the complex one
  const storiesWithAds = simplifiedStoriesWithAds

  // If loading, show skeleton cards
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
    <motion.div
      layout
      className={gridClass}
    >
      {storiesWithAds.map((item, index) => {
        if ("isAd" in item) {
          return (
            <div key={`ad-${index}`} className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 w-full">
              <AdBanner
                type="interstitial"
                className="w-full h-32 sm:h-40"
              />
            </div>
          )
        }

        return (
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
        )
      })}
    </motion.div>
  )
}

