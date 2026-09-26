"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Chapter as ChapterType } from "@/types/story"
import { isWithin48Hours } from "@/utils/date-utils"

export interface ChapterListProps {
  chapters: ChapterType[]
  storySlug: string
  currentChapter: number | null
}

export function ChapterList({ chapters, storySlug, currentChapter }: ChapterListProps) {
  const [isOpen, setIsOpen] = useState(true)

  // Guard: Empty chapter list state
  if (chapters.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">No chapters available yet.</p>
      </div>
    )
  }

  const lastUpdatedFormatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(chapters[chapters.length - 1].updatedAt))

  return (
    <div className="w-full border rounded-lg bg-card text-card-foreground">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 font-medium transition-all hover:underline"
        aria-expanded={isOpen}
      >
        <div className="flex justify-between items-center w-full pr-2">
          <span>Chapters ({chapters.length})</span>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdatedFormatted}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t divide-y text-sm">
          {chapters.map((chapter) => {
            const isCurrent = chapter.number === currentChapter
            const isNew = chapter.status === "published" && isWithin48Hours(chapter.publishDate || chapter.createdAt)

            const daysSinceUpdate = Math.floor(
              (Date.now() - new Date(chapter.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
            )
            const isUpdated =
              chapter.status === "published" &&
              daysSinceUpdate <= 2 &&
              new Date(chapter.updatedAt).getTime() > new Date(chapter.publishDate || chapter.createdAt).getTime() + 60000 &&
              !isNew

            return (
              <div
                key={chapter.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center gap-2 ${isCurrent ? "bg-primary/5" : ""}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{chapter.title}</span>
                    {isNew && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        New
                      </Badge>
                    )}
                    {isUpdated && (
                      <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                        Updated
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-sm text-muted-foreground">{chapter.wordCount.toLocaleString()} words</span>

                  <Link href={`/story/${storySlug}/chapter/${chapter.number}`}>
                    <Button variant="outline" size="sm">
                      Read
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ChapterList
