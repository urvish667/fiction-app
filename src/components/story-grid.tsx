"use client"

import { Fragment } from "react"
import { motion } from "framer-motion"
import StoryCard, { type StoryCardData, type StoryCardVariant } from "@/components/story-card"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import AdBanner from "@/components/ad-banner"

interface StoryGridProps {
  stories: StoryCardData[]
  viewMode: "grid" | "list"
  isLoading?: boolean
  onBookmark?: (id: string | number) => void
}

export default function StoryGrid({
  stories,
  viewMode,
  isLoading = false,
  onBookmark,
}: StoryGridProps) {
  const variant: StoryCardVariant = "landscape-list"

  const gridClass =
    viewMode === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
      : "flex flex-col gap-3.5"

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 8 }).map((_, i) => (
          <StoryCardSkeleton key={`skeleton-${i}`} variant={variant} />
        ))}
      </div>
    )
  }

  return (
    <motion.div layout className={gridClass}>
      {stories.map((item, index) => (
        <Fragment key={item.id}>
          <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <StoryCard
              story={item}
              variant={variant}
              showBookmark
              onBookmark={onBookmark}
            />
          </motion.div>

          {/* Ad Banner displayed every 4 story cards on smaller screens */}
          {(index + 1) % 4 === 0 && (
            <div className="col-span-full xl:hidden my-2 flex justify-center">
              <AdBanner
                type="banner"
                className="w-full max-w-[728px] min-h-[90px]"
                slot="6596765108"
              />
            </div>
          )}
        </Fragment>
      ))}
    </motion.div>
  )
}

