"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import StoryCard from "@/components/story-card"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import { StoryService } from "@/lib/api/story"
import { ImageService } from "@/lib/api/images"

interface MostViewedStoriesProps {
  className?: string
}

export default function MostViewedStories({ className }: MostViewedStoriesProps) {
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    async function fetchMostViewedStories() {
      try {
        setLoading(true)
        setError(null)

        const response = await StoryService.getStories({
          sortBy: 'mostViewed',
          limit: 8
        })

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch most viewed stories')
        }

        const rawStories = response.data?.stories || []
        const formatted = rawStories.map((story: any) => ({
          ...story,
          author: story.author?.name || story.author?.username || "Unknown Author",
          coverImage: ImageService.getImageUrl(story.coverImage) || "/placeholder.svg",
          viewCount: story.viewCount || story.readCount || 0,
        }))

        setStories(formatted)
      } catch (err) {
        console.error('Error fetching most viewed stories:', err)
        setError('Failed to load stories')
      } finally {
        setLoading(false)
      }
    }

    fetchMostViewedStories()
  }, [])

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
  }, [stories])

  if (loading) {
    return (
      <section className={`py-6 sm:py-8 bg-background ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold">Most Read Stories</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Most read stories of all time</p>
            </div>
            <Link href="/browse?sortBy=mostRead">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
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

  if (error || stories.length === 0) {
    return null
  }

  return (
    <section className={`py-6 sm:py-8 bg-background ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">Most Read Stories</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Most read stories of all time</p>
          </div>
          <Link href="/browse?sortBy=mostRead">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        <div className="relative group/carousel">
          <div
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-1 px-0.5"
          >
            {stories.map((story) => (
              <div
                key={story.id}
                className="w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.5rem)] lg:w-[calc(16.666%-0.625rem)] shrink-0 snap-start"
              >
                <StoryCard
                  story={story}
                  variant="portrait-grid"
                  showBookmark={false}
                  overlayTitle={true}
                />
              </div>
            ))}
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
  )
}
