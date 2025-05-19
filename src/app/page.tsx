"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Flame } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  const [stories, setStories] = useState<any[] | null>(null)

  useEffect(() => {
    async function fetchMostViewedStories() {
      try {
        const response = await fetch('/api/stories/most-viewed?limit=4&timeRange=all')
        if (response.ok) {
          const data = await response.json()
          setStories(data.stories || [])
        } else {
          setStories([])
        }
      } catch (error) {
        setStories([])
      }
    }

    fetchMostViewedStories()
  }, [])

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 lg:py-36 px-8 overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Unleash Your Stories, One Page at a Time
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our community of writers and readers to discover, create, and share captivating stories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse">
                <Button size="lg" className="text-base">
                  Start Reading
                </Button>
              </Link>
              <Link href="/write/story-info">
                <Button size="lg" variant="outline" className="text-base border-2 border-primary">
                  Start Writing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Abstract background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-3xl"></div>
        </div>
      </section>

      {/* Most Viewed Stories Section */}
      <section className="py-16 px-8 bg-background">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold">Most Viewed Stories</h2>
              <p className="text-muted-foreground mt-1">Our most popular stories</p>
            </div>
            <Link href="/browse?sortBy=mostRead">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>

          {!stories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : stories.length === 0 ? (
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stories.map((story, index) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  isTopStory={index === 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Explore Categories Section */}
      <section className="py-16 px-8 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-10">Explore Categories</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/browse?genre=${encodeURIComponent(category)}`}
                passHref
              >
                <Button variant="secondary" className="rounded-full">
                  {category}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Join Community Section */}
      <section className="py-20 px-8 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Community</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with thousands of writers and readers, get feedback on your work, and discover new stories every
            day.
          </p>
          <Button size="lg" className="text-base">
            Sign Up Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </main>
  )
}

// Update the StoryCard component in the homepage to make it clickable
function StoryCard({ story, isTopStory = false }: { story: any, isTopStory?: boolean }) {
  const router = useRouter()

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/story/${story.slug || story.id}`)}
      className="cursor-pointer"
    >
      <Card className={`h-full overflow-hidden flex flex-col ${isTopStory ? 'ring-2 ring-primary' : ''}`}>
        <div className="relative aspect-[3/2] overflow-hidden">
          <Image
            src={story.coverImage || "/placeholder.svg"}
            alt={story.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            unoptimized={true}
            onError={(e) => {
              // @ts-ignore - setting src on error
              e.target.src = "/placeholder.svg";
            }}
          />
          <Badge className="absolute top-2 right-2">
            {typeof story.genre === 'object' && story.genre !== null
              ? (story.genre as {name: string}).name
              : (typeof story.genre === 'string' ? story.genre : 'General')}
          </Badge>
          {isTopStory && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md flex items-center gap-1">
              <Flame size={14} />
              <span className="text-xs font-medium">Most Read</span>
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <h3 className="font-bold text-lg line-clamp-1">{story.title}</h3>
          <p className="text-sm text-muted-foreground">by {typeof story.author === 'object' ?
            (story.author?.name || story.author?.username || "Unknown Author") :
            story.author}</p>
        </CardHeader>
        <CardContent className="pb-2 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2">{story.description || story.excerpt}</p>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Heart size={16} className="text-muted-foreground" />
            <span>{(story.likeCount || story.likes || 0).toLocaleString()}</span>
          </div>
          <span className="text-sm text-muted-foreground">{(typeof story.viewCount === 'number' ? story.viewCount : story.readCount || 0).toLocaleString()} views</span>
        </CardFooter>
      </Card>
    </motion.div>
  )
}



const categories = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Horror",
  "Historical",
  "Adventure",
  "Young Adult",
  "Drama",
  "Comedy",
  "Non-Fiction",
  "Memoir",
  "Biography",
  "Self-Help",
  "Children",
  "Crime",
  "Poetry",
  "LGBTQ+",
  "Short Story",
  "Urban",
  "Paranormal",
  "Dystopian",
  "Slice of Life",
  "Fanfiction"
]
