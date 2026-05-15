"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Chapter } from "@/types/story"
import Link from "next/link"

interface ChapterNavigationProps {
  chapters: Chapter[]
  currentChapter: Chapter
  storySlug: string
  navigateToChapter: (direction: "prev" | "next") => void
}

export function ChapterNavigation({ chapters, currentChapter, storySlug, navigateToChapter }: ChapterNavigationProps) {
  const currentIndex = chapters.findIndex((c) => c.number === currentChapter.number)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < chapters.length - 1

  return (
    <div className="flex justify-between items-center mb-8 sm:mb-12">
      {hasPrevious ? (
        <Button
          variant="outline"
          asChild
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <Link
            href={`/story/${storySlug}/chapter/${chapters[currentIndex - 1].number}`}
            onClick={(e) => {
              e.preventDefault()
              navigateToChapter("prev")
            }}
          >
            <ChevronLeft size={16} />
            <span>Previous Chapter</span>
          </Link>
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <ChevronLeft size={16} />
          <span>Previous Chapter</span>
        </Button>
      )}

      {hasNext ? (
        <Button
          variant="outline"
          asChild
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <Link
            href={`/story/${storySlug}/chapter/${chapters[currentIndex + 1].number}`}
            onClick={(e) => {
              e.preventDefault()
              navigateToChapter("next")
            }}
          >
            <span>Next Chapter</span>
            <ChevronRight size={16} />
          </Link>
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <span>Next Chapter</span>
          <ChevronRight size={16} />
        </Button>
      )}
    </div>
  )
}
