"use client"

import { useState } from "react"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Calendar, CheckCircle2 } from "lucide-react"
import type { Chapter } from "@/lib/types"
import { Progress } from "@/components/ui/progress"

interface ChapterListProps {
  chapters: Chapter[]
  storySlug: string
  currentChapter: number | null
}

export default function ChapterList({ chapters, storySlug, currentChapter }: ChapterListProps) {
  const [expanded, setExpanded] = useState(true)

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

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
              Last updated: {formatDate(chapters[chapters.length - 1].publishDate)}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="divide-y">
            {chapters.map((chapter) => {
              const isLocked = chapter.isPremium
              const isFuture = chapter.publishDate > new Date()
              const isRead = chapter.number < (currentChapter || 0)
              const isCurrent = chapter.number === currentChapter

              return (
                <div
                  key={chapter.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center gap-2 ${isCurrent ? "bg-primary/5" : ""}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Chapter {chapter.number}:</span>
                      <span>{chapter.title}</span>

                      {isLocked && (
                        <Badge variant="outline" className="ml-2 flex items-center gap-1">
                          <Lock size={12} />
                          Premium
                        </Badge>
                      )}

                      {isFuture && (
                        <Badge variant="outline" className="ml-2 flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(chapter.publishDate)}
                        </Badge>
                      )}

                      {isRead && (
                        <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Read
                        </Badge>
                      )}
                    </div>

                    {chapter.readProgress > 0 && chapter.readProgress < 100 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={chapter.readProgress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground">{chapter.readProgress}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-sm text-muted-foreground">{chapter.wordCount.toLocaleString()} words</span>

                    {isLocked ? (
                      <Button variant="outline" size="sm">
                        Unlock
                      </Button>
                    ) : isFuture ? (
                      <Button variant="outline" size="sm" disabled>
                        Coming Soon
                      </Button>
                    ) : (
                      <Link href={`/story/${storySlug}/chapter/${chapter.number}`}>
                        <Button variant="outline" size="sm">
                          {isRead ? "Reread" : isCurrent ? "Continue" : "Read"}
                        </Button>
                      </Link>
                    )}
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

