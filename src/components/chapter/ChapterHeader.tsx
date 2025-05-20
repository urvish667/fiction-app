"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Story, Chapter } from "@/types/story"
import { isWithin48Hours } from "@/utils/date-utils"

interface ChapterHeaderProps {
  story: Story
  chapter: Chapter
  formatDate: (date: Date | string) => string
}

export function ChapterHeader({ story, chapter, formatDate }: ChapterHeaderProps) {
  const isNew = chapter.status === 'published' && isWithin48Hours(chapter.updatedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold">{chapter.title}</h1>
        {isNew && (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            New
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <Link href={`/story/${story.slug}`} className="font-medium hover:underline">
          {story.title}
        </Link>
        <span className="hidden xs:inline">•</span>
        <Link href={`/user/${story.author?.username || "unknown"}`} className="hover:underline">
          By {typeof story.author === 'object' ?
            (story.author?.name || story.author?.username || "Unknown Author") :
            "Unknown Author"}
        </Link>
        <span className="hidden xs:inline">•</span>
        <Badge variant="outline" className="mr-1">
          {typeof story.genre === 'object' && story.genre !== null
            ? (story.genre as {name: string}).name
            : (typeof story.genre === 'string' ? story.genre : 'General')}
        </Badge>
        <span className="hidden xs:inline">•</span>
        <span className="text-xs sm:text-sm">Updated {formatDate(chapter.updatedAt)}</span>
      </div>
    </motion.div>
  )
}
