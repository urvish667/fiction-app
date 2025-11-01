"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Flame, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import StoryCardSkeleton from "@/components/story-card-skeleton"

interface Story {
  id: string
  title: string
  slug: string
  description?: string
  coverImage?: string
  author: {
    id: string
    name?: string
    username?: string
    image?: string
  }
  genre?: {
    name: string
  }
  tags: string[]
  likeCount: number
  commentCount: number
  bookmarkCount: number
  chapterCount: number
  viewCount: number
  isMature?: boolean
}

interface MostViewedStoriesProps {
  className?: string
}

export default function MostViewedStories({ className }: MostViewedStoriesProps) {
  const [stories, setStories] = useState<Story[]>([])
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
    async function fetchMostViewedStories() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/stories/most-viewed?limit=4&timeRange=7days')

        if (!response.ok) {
          throw new Error('Failed to fetch most viewed stories')
        }

        const data = await response.json()
        setStories(data.stories || [])
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
      <section className={`py-16 bg-background ${className}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold">Top Read Stories Of This Week</h2>
              <p className="text-muted-foreground mt-1">Top read stories from the last 7 days</p>
            </div>
            <Link href="/browse?sortBy=mostRead">
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
    return (
      <section className={`py-16 bg-background ${className}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold">Top Read Stories Of This Week</h2>
              <p className="text-muted-foreground mt-1">Top read stories from the last 7 days</p>
            </div>
            <Link href="/browse?sortBy=mostRead">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>

          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load stories. Please try again later.</p>
            <div className="mt-4 flex justify-center gap-4">
              <Link href="/browse">
                <Button>Browse Stories</Button>
              </Link>
              <Link href="/write/story-info">
                <Button variant="outline">Start Writing</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (stories.length === 0) {
    return (
      <section className={`py-16 bg-background ${className}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold">Top Read Stories Of This Week</h2>
              <p className="text-muted-foreground mt-1">Most read stories from the last 7 days</p>
            </div>
            <Link href="/browse?sortBy=mostRead">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>

          <div className="text-center py-12">
            <p className="text-muted-foreground">No stories available yet. Start reading or writing to see stories here!</p>
            <div className="mt-4 flex justify-center gap-4">
              <Link href="/browse">
                <Button>Browse Stories</Button>
              </Link>
              <Link href="/write/story-info">
                <Button variant="outline">Start Writing</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`py-16 bg-background ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold">Top Read Stories Of This Week</h2>
            <p className="text-muted-foreground mt-1">Most read stories from the last 7 days</p>
          </div>
          <Link href="/browse?sortBy=mostRead">
            <Button variant="ghost">View All</Button>
          </Link>
        </div>

        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="grid grid-flow-col auto-cols-[calc(100%-0.5rem)] sm:auto-cols-[calc(50%-0.5rem)] lg:auto-cols-[calc(33.33%-0.5rem)] xl:auto-cols-[calc(25%-0.5rem)] gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
          >
            {stories.map((story, index) => (
              <StoryCard
                key={story.id}
                story={story}
                isTopStory={index === 0}
              />
            ))}
          </div>
          {isOverflowing && canScrollLeft && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 transform bg-background/50 hover:bg-background/80 rounded-full"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {isOverflowing && canScrollRight && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 transform bg-background/50 hover:bg-background/80 rounded-full"
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

// StoryCard component for client-side rendering
function StoryCard({ story, isTopStory = false }: { story: Story, isTopStory?: boolean }) {
  return (
    <Link href={`/story/${story.slug || story.id}`} className="block p-1">
      <Card className={`h-full overflow-hidden flex flex-col hover:shadow-lg transition-shadow cursor-pointer ${isTopStory ? 'ring-2 ring-primary' : ''}`}>
        <div className="relative aspect-[3/2] overflow-hidden">
          <Image
            src={story.coverImage || "/placeholder.svg"}
            alt={story.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            unoptimized={true}
          />
          {/* Top left badges - 18+ and Most Read side by side */}
          <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
            {story.isMature && (
              <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-2 py-1">
                18+
              </Badge>
            )}
            {isTopStory && (
              <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md flex items-center gap-1">
                <Flame size={14} />
                <span className="text-xs font-medium">Most Read</span>
              </div>
            )}
          </div>
          
          {/* Genre badge on top right */}
          <Badge className="absolute top-2 right-2">
            {typeof story.genre === 'object' && story.genre !== null
              ? story.genre.name
              : 'General'}
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
            <span>{story.viewCount.toLocaleString()} views</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
