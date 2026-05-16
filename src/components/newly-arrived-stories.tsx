"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import { StoryService } from "@/lib/api/story"
import { ImageService } from "@/lib/api/images"
import type { StoryResponse } from "@/types/story"

interface NewlyArrivedStoriesProps {
  className?: string
}

export default function NewlyArrivedStories({ className }: NewlyArrivedStoriesProps) {
  const [stories, setStories] = useState<StoryResponse[]>([])
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
    async function fetchStories() {
      try {
        setLoading(true)
        setError(null)

        const response = await StoryService.getStories({
          sortBy: 'newest',
          limit: 8
        })

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch newly arrived stories')
        }

        setStories(response.data?.stories || [])
      } catch (err) {
        console.error('Error fetching newly arrived stories:', err)
        setError('Failed to load stories')
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
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
      <section className={`py-8 bg-background ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold">Newly Arrived</h2>
              <p className="text-muted-foreground mt-1">Fresh stories just for you</p>
            </div>
            <Link href="/browse?sortBy=newest">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <StoryCardSkeleton key={`skeleton-${index}`} viewMode="grid" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return null; // Return null to gracefully hide the section on error
  }

  if (stories.length === 0) {
    return null; // Return null if no stories exist
  }

  return (
    <section className={`py-8 bg-background ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-semibold">Newly Arrived</h2>
            <p className="text-muted-foreground mt-1">Fresh stories just for you</p>
          </div>
          <Link href="/browse?sortBy=newest">
            <Button variant="ghost">View All</Button>
          </Link>
        </div>

        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="grid grid-flow-col auto-cols-[calc(100%-0.5rem)] sm:auto-cols-[calc(50%-0.5rem)] lg:auto-cols-[calc(33.33%-0.5rem)] xl:auto-cols-[calc(25%-0.5rem)] gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
          >
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
              />
            ))}
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
      </div>
    </section>
  )
}

function StoryCard({ story }: { story: StoryResponse }) {
  return (
    <Link href={`/story/${story.slug || story.id}`} className="block p-1">
      <Card className="h-full overflow-hidden flex flex-col hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative aspect-[3/2] overflow-hidden">
          <Image
            src={ImageService.getImageUrl(story.coverImage) || "/placeholder.svg"}
            alt={story.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            unoptimized={true}
          />
          <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
            {story.isMature && (
              <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-2 py-1">
                18+
              </Badge>
            )}
            <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-2 py-1">
              New
            </Badge>
          </div>
          
          <Badge className="absolute top-2 right-2">
            {typeof story.genre === 'object' && story.genre !== null
              ? (story.genre as {name: string}).name
              : (typeof story.genre === 'string' ? story.genre : 'General')}
          </Badge>
        </div>
        <CardHeader className="pb-2">
          <h3 className="font-bold text-lg line-clamp-1">{story.title}</h3>
          <p className="text-sm text-muted-foreground">
            by {story.author?.name || story.author?.username || "Unknown Author"}
          </p>
        </CardHeader>
        <CardContent className="pb-2 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2">{story.description}</p>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Heart size={16} className="text-muted-foreground" />
            <span>{story.likeCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye size={16} className="text-muted-foreground" />
            <span>{(story.viewCount || 0).toLocaleString()} views</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
