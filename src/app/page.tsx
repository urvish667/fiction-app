import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Flame, Eye } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { generateHomepageMetadata, generateHomepageStructuredData, generateOrganizationStructuredData } from "@/lib/seo/metadata"
import { prisma } from "@/lib/auth/db-adapter"
import { ViewService } from "@/services/view-service"

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageMetadata()
}

// Server component to fetch most viewed stories
async function getMostViewedStories() {
  try {
    // Get most viewed story IDs using the optimized ViewService
    const mostViewedStoryIds = await ViewService.getMostViewedStories(4, 'all')

    if (mostViewedStoryIds.length === 0) {
      return []
    }

    // Find stories by IDs
    const stories = await prisma.story.findMany({
      where: {
        id: { in: mostViewedStoryIds },
        status: { not: 'draft' } // Only include published stories
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        genre: true,
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
            chapters: true,
          },
        },
      },
    })

    // Get combined view counts (story + chapter views) for these stories
    const viewCountMap = await ViewService.getBatchCombinedViewCounts(
      mostViewedStoryIds,
      'all'
    )

    // Sort stories by view count (descending)
    const sortedStories = [...stories].sort((a, b) => {
      const viewsA = viewCountMap.get(a.id) || 0
      const viewsB = viewCountMap.get(b.id) || 0
      return viewsB - viewsA
    })

    // Transform stories to include counts and format tags
    const formattedStories = sortedStories.map((story) => {
      // Extract tags safely
      const tags = Array.isArray(story.tags)
        ? story.tags.map(storyTag => storyTag.tag?.name || '').filter(Boolean)
        : []

      // Get view count from our map
      const viewCount = viewCountMap.get(story.id) || 0

      return {
        ...story,
        tags,
        likeCount: story._count.likes,
        commentCount: story._count.comments,
        bookmarkCount: story._count.bookmarks,
        chapterCount: story._count.chapters,
        viewCount,
        _count: undefined,
      }
    })

    return formattedStories
  } catch (error) {
    console.error('Error fetching most viewed stories:', error)
    return []
  }
}

export default async function Home() {
  const stories = await getMostViewedStories()
  const homepageStructuredData = generateHomepageStructuredData()
  const organizationStructuredData = generateOrganizationStructuredData()

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homepageStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />

      <main className="min-h-screen">
        <Navbar />

        {/* Hero Section */}
        <section className="relative py-20 md:py-28 lg:py-36 px-8 overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-3xl mx-auto">
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
            </div>
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

            {stories.length === 0 ? (
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
            <div className="flex justify-center">
              <Link href="https://discord.gg/JVMr2TRXY7" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="text-base flex items-center justify-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Join Discord
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <SiteFooter />
      </main>
    </>
  )
}

// StoryCard component for server-side rendering
function StoryCard({ story, isTopStory = false }: { story: any, isTopStory?: boolean }) {
  return (
    <Link href={`/story/${story.slug || story.id}`}>
      <Card className={`h-full overflow-hidden flex flex-col hover:shadow-lg transition-shadow cursor-pointer ${isTopStory ? 'ring-2 ring-primary' : ''}`}>
        <div className="relative aspect-[3/2] overflow-hidden">
          <Image
            src={story.coverImage || "/placeholder.svg"}
            alt={story.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            unoptimized={true}
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
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye size={16} className="text-muted-foreground" />
            <span>{(typeof story.viewCount === 'number' ? story.viewCount : story.readCount || 0).toLocaleString()} views</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
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
