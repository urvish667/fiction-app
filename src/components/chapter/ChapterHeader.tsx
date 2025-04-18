"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Story, Chapter } from "@/types/story"

interface ChapterHeaderProps {
  story: Story
  chapter: Chapter
  formatDate: (date: Date | string) => string
}

export function ChapterHeader({ story, chapter, formatDate }: ChapterHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h1 className="text-3xl font-bold mb-2">{chapter.title}</h1>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/story/${story.slug}`} className="font-medium hover:underline">
          {story.title}
        </Link>
        <span>•</span>
        <Link href={`/user/${story.author?.username || "unknown"}`} className="hover:underline">
          By {typeof story.author === 'object' ?
            (story.author?.name || story.author?.username || "Unknown Author") :
            "Unknown Author"}
        </Link>
        <span>•</span>
        <Badge variant="outline">
          {typeof story.genre === 'object' && story.genre !== null
            ? (story.genre as {name: string}).name
            : (typeof story.genre === 'string' ? story.genre : 'General')}
        </Badge>
        <span>•</span>
        <span>Updated {formatDate(chapter.updatedAt)}</span>
      </div>
    </motion.div>
  )
}
