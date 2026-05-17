"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ImageService } from "@/lib/api/images"
import { apiClient } from "@/lib/apiClient"
import { useAuth } from "@/lib/auth-context"

interface ContinueReadingProps {
  className?: string
}

export default function ContinueReading({ className }: ContinueReadingProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
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
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
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
        }>('/reading-progress/history?limit=10')

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

  // Don't render anything if still loading auth or not authenticated
  if (authLoading || !isAuthenticated || (isAuthenticated && loading)) {
    return null
  }

  const validHistory = readingHistory.filter(item => item && item.chapter && item.chapter.story);

  return (
    <section className={`py-8 bg-background ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-semibold">Continue Reading</h2>
            <p className="text-muted-foreground mt-1">Jump right back into your stories</p>
          </div>
        </div>

        {validHistory.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-2xl border border-dashed border-muted">
            <p className="text-muted-foreground italic">No reading history yet</p>
          </div>
        ) : (
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="grid grid-flow-col auto-cols-[calc(100%-0.5rem)] sm:auto-cols-[calc(50%-0.5rem)] lg:auto-cols-[calc(33.33%-0.5rem)] xl:auto-cols-[calc(25%-0.5rem)] gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
            >
              {validHistory.map((historyItem) => {
                const story = historyItem.chapter?.story
                const chapter = historyItem.chapter

                if (!story) return null;

                return (
                  <Link key={historyItem.id} href={`/story/${story.slug || story.id}/chapter/${chapter?.id || ''}`} className="block p-1">
                    <Card className="h-full overflow-hidden flex flex-col hover:shadow-lg transition-shadow cursor-pointer border-primary/20 bg-primary/5">
                      <div className="relative aspect-[3/2] overflow-hidden">
                        <Image
                          src={ImageService.getImageUrl(story.coverImage) || "/placeholder.svg"}
                          alt={story.title}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                          unoptimized={true}
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
                          <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md flex items-center gap-1">
                            <BookOpen size={14} />
                            <span className="text-xs font-bold">Reading</span>
                          </div>
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <h3 className="font-bold text-lg line-clamp-1">{story.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {chapter?.title ? `Current: ${chapter.title}` : 'Continue reading'}
                        </p>
                      </CardHeader>
                      <CardContent className="pb-4 flex-grow">
                        {historyItem.progress > 0 && (
                          <div className="w-full bg-secondary rounded-full h-2.5 mt-2">
                            <div
                              className="bg-primary h-2.5 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, historyItem.progress))}%` }}
                            ></div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
            {isOverflowing && canScrollLeft && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 transform bg-background/50 hover:bg-background/80 rounded-full z-10"
                onClick={scrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {isOverflowing && canScrollRight && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 transform bg-background/50 hover:bg-background/80 rounded-full z-10"
                onClick={scrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
