"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Chapter } from "@/types/story"

interface ChapterNavigationProps {
  chapters: Chapter[]
  currentChapter: Chapter
  navigateToChapter: (direction: "prev" | "next") => void
}

export function ChapterNavigation({ chapters, currentChapter, navigateToChapter }: ChapterNavigationProps) {
  const currentIndex = chapters.findIndex((c) => c.number === currentChapter.number)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < chapters.length - 1

  return (
    <div className="flex justify-between items-center mb-8 sm:mb-12">
      <Button
        variant="outline"
        onClick={() => navigateToChapter("prev")}
        disabled={!hasPrevious}
        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
      >
        <ChevronLeft size={16} />
        <span>Previous Chapter</span>
      </Button>

      <Button
        variant="outline"
        onClick={() => navigateToChapter("next")}
        disabled={!hasNext}
        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
      >
        <span>Next Chapter</span>
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}
