"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ImageService } from "@/lib/api/images"
import { apiClient } from "@/lib/apiClient"
import { useAuth } from "@/lib/auth-context"
import StoryCardSkeleton from "@/components/story-card-skeleton"

interface ContinueReadingProps {
  className?: string
}

function getGenreName(genre: any): string {
  if (!genre) return "General"
  if (typeof genre === "object" && "name" in genre) return genre.name
  return String(genre)
}

export default function ContinueReading({ className }: ContinueReadingProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [readingHistory, setReadingHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkForOverflow = () => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current
      setIsOverflowing(scrollWidth > clientWidth)
    }
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 2)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2)
    }
  }

  const scrollByAmount = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const amount = scrollContainerRef.current.clientWidth * 0.75
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      })
    }
  }

  useEffect(() => {
    async function fetchReadingHistory() {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await apiClient.get<{
          success: boolean;
          data: any[];
        }>('/reading-progress/history?limit=8')

        if (response.success && response.data) {
          setReadingHistory(response.data)
        }
      } catch (err) {
        console.error('Error fetching reading history:', err)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchReadingHistory()
    }
  }, [isAuthenticated, authLoading])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      checkForOverflow()
      handleScroll()

      container.addEventListener('scroll', handleScroll)
      const resizeObserver = new ResizeObserver(() => {
        checkForOverflow()
        handleScroll()
      })
      resizeObserver.observe(container)

      return () => {
        container.removeEventListener('scroll', handleScroll)
        resizeObserver.unobserve(container)
      }
    }
  }, [readingHistory])

  if (authLoading || !isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <section className={`py-6 sm:py-8 bg-background ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold">Continue Reading</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Jump right back into your stories</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <StoryCardSkeleton key={`skeleton-${index}`} variant="portrait-grid" overlayTitle={true} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  const validHistory = readingHistory.filter(item => item && item.chapter && item.chapter.story);

  if (validHistory.length === 0) {
    return null
  }

  return (
    <section className={`py-6 sm:py-8 bg-background ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Continue Reading</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Jump right back into your stories</p>
        </div>

        <div className="relative group/carousel">
          <div
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-1 px-0.5"
          >
            {validHistory.map((historyItem) => {
              const story = historyItem.chapter?.story
              const chapter = historyItem.chapter

              if (!story) return null;

              const imageUrl = ImageService.getImageUrl(story.coverImage) || "/placeholder.svg"
              const genreName = getGenreName(story.genre)
              const chapterNum = chapter?.number ?? chapter?.chapterNumber ?? chapter?.id ?? 1
              const chapterTitle = chapter?.title || (chapter?.number ? `Chapter ${chapter.number}` : chapter?.chapterNumber ? `Chapter ${chapter.chapterNumber}` : "Continue reading")
              const progressPercent = Math.min(100, Math.max(0, historyItem.progress || 0))

              return (
                <div
                  key={historyItem.id}
                  className="w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.5rem)] lg:w-[calc(16.666%-0.625rem)] shrink-0 snap-start"
                >
                  <Link
                    href={`/story/${story.slug || story.id}/chapter/${chapterNum}`}
                    className="group/card block h-full"
                  >
                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-sm bg-muted">
                      <Image
                        src={imageUrl}
                        alt={story.title || "Story Cover"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                        unoptimized
                      />

                      {/* Dark gradient overlay at bottom */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                      {/* Top-left Genre badge */}
                      <Badge className="absolute top-2 left-2 text-xs font-medium bg-black/60 text-white border-0 backdrop-blur-sm z-10">
                        {genreName}
                      </Badge>

                      {/* Top-right Reading Badge */}
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md flex items-center gap-1 z-10">
                        <BookOpen size={11} />
                        <span className="text-[10px] font-bold">Reading</span>
                      </div>

                      {/* Bottom overlay: Chapter title & Progress bar (NO Story Title) */}
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 text-white z-10">
                        <p className="text-xs font-medium leading-snug line-clamp-1 text-white/90 mb-1.5 drop-shadow-md">
                          {chapterTitle}
                        </p>
                        {progressPercent > 0 && (
                          <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Left Chevron */}
          {isOverflowing && canScrollLeft && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-1 sm:-left-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-background/80 hover:bg-background text-foreground shadow-md backdrop-blur-md z-20 border border-border/60"
              onClick={() => scrollByAmount("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Right Chevron */}
          {isOverflowing && canScrollRight && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-1 sm:-right-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-background/80 hover:bg-background text-foreground shadow-md backdrop-blur-md z-20 border border-border/60"
              onClick={() => scrollByAmount("right")}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
