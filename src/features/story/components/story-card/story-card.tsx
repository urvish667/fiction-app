"use client"

import type React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { type StoryCardProps } from "./story-card.types"
import { PortraitGridCard } from "./story-card-portrait"
import { LandscapeListCard } from "./story-card-landscape"
import { MiniHorizontalCard } from "./story-card-mini"
import { FeaturedCard } from "./story-card-featured"
import { PortraitWorkCard } from "./story-card-work"

export function StoryCard({
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
        return (
          <PortraitGridCard
            story={story}
            showBookmark={showBookmark}
            showStats={showStats}
            overlayTitle={overlayTitle}
            showTitle={showTitle}
            isTopStory={isTopStory}
            onBookmark={onBookmark}
          />
        )
      case "landscape-list":
        return (
          <LandscapeListCard
            story={story}
            showBookmark={showBookmark}
            onBookmark={onBookmark}
          />
        )
      case "mini-horizontal":
        return <MiniHorizontalCard story={story} />
      case "featured":
        return (
          <FeaturedCard
            story={story}
            showBookmark={showBookmark}
            onBookmark={onBookmark}
          />
        )
      case "portrait-work":
        return (
          <PortraitWorkCard
            story={story}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        )
      default:
        return (
          <PortraitGridCard
            story={story}
            showBookmark={showBookmark}
            showStats={showStats}
            overlayTitle={overlayTitle}
            showTitle={showTitle}
            isTopStory={isTopStory}
            onBookmark={onBookmark}
          />
        )
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

export default StoryCard
