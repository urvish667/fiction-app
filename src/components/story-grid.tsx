"use client"
import { motion } from "framer-motion"
import StoryCard from "@/components/story-card"
import AdBanner from "@/components/ad-banner"

// Define a generic type for stories that matches what StoryCard expects
type StoryItem = {
  id: string | number
  title: string
  author: any
  genre?: string | any
  thumbnail?: string
  coverImage?: string
  excerpt?: string
  description?: string
  likes?: number
  likeCount?: number
  comments?: number
  commentCount?: number
  reads?: number
  readCount?: number
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
}

export default function StoryGrid({ stories, viewMode, showAds = false }: StoryGridProps) {
  // Insert ads after every 6 stories
  const storiesWithAds = showAds
    ? stories.reduce((acc: (StoryItem | { isAd: true })[], story, index) => {
        acc.push(story)
        if ((index + 1) % 6 === 0 && index !== stories.length - 1) {
          acc.push({ isAd: true })
        }
        return acc
      }, [])
    : stories

  return (
    <motion.div
      layout
      className={`grid gap-6 ${
        viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
      }`}
    >
      {storiesWithAds.map((item, index) => {
        if ("isAd" in item) {
          return (
            <div key={`ad-${index}`} className={viewMode === "grid" ? "col-span-full" : ""}>
              <AdBanner type="interstitial" className="w-full h-32 sm:h-40" />
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

