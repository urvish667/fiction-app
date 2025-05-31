"use client"

import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Chapter as ChapterType } from "@/types/story"
import { isWithin48Hours } from "@/utils/date-utils"

interface ChapterListProps {
  chapters: ChapterType[]
  storySlug: string
  currentChapter: number | null
}

export default function ChapterList({ chapters, storySlug, currentChapter }: ChapterListProps) {

  if (chapters.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">No chapters available yet.</p>
      </div>
    )
  }

  return (
    <Accordion type="single" collapsible defaultValue="chapters" className="w-full border rounded-lg">
      <AccordionItem value="chapters">
        <AccordionTrigger className="px-4">
          <div className="flex justify-between items-center w-full">
            <span>Chapters ({chapters.length})</span>
            <span className="text-sm text-muted-foreground">
              Last updated: {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date(chapters[chapters.length - 1].updatedAt))}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="divide-y">
            {chapters.map((chapter) => {
              const isCurrent = chapter.number === currentChapter
              const isNew = chapter.status === 'published' && isWithin48Hours(chapter.updatedAt)

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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

