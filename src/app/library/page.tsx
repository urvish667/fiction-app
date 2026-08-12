"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import Navbar from "@/components/navbar"
import StoryGrid from "@/components/story-grid"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import AdBanner from "@/components/ad-banner"
import { StoryService } from "@/lib/api/story"
import { ImageService } from "@/lib/api/images"
import { useToast } from "@/hooks/use-toast"
import { logError } from "@/lib/error-logger"
import type { StoryCardData } from "@/components/story-card"

export default function LibraryPage() {
  const { toast } = useToast()
  const { user } = useRequireAuth()
  
  // State variables for library data & filtering (matching old page filter options)
  const [bookmarkedStories, setBookmarkedStories] = useState<StoryCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterGenre, setFilterGenre] = useState("all")

  // Fetch bookmarked stories from API
  useEffect(() => {
    if (!user) return

    const fetchBookmarkedStories = async () => {
      try {
        setLoading(true)
        const response = await StoryService.getBookmarkedStories()

        if (response.success && response.data) {
          const { data: { stories } } = response

          const formattedStories: StoryCardData[] = stories.map((story: any) => {
            let genreName = "General"
            if (story.genre && typeof story.genre === "object" && story.genre.name) {
              genreName = story.genre.name
            } else if (typeof story.genre === "string") {
              genreName = story.genre
            }

            const tags = Array.isArray(story.tags)
              ? story.tags
                  .map((t: any) => (typeof t === "string" ? t : t?.name || t?.tag?.name || ""))
                  .filter(Boolean)
              : []

            return {
              id: story.id,
              title: story.title,
              author: story.author?.name || story.author?.username || (typeof story.author === "string" ? story.author : "Unknown Author"),
              genre: genreName,
              language: typeof story.language === "object" ? story.language?.name : (story.language || ""),
              status: story.status || "ongoing",
              coverImage: story.coverImage ? ImageService.getImageUrl(story.coverImage) || "/placeholder.svg" : "/placeholder.svg",
              excerpt: story.description || "",
              description: story.description || "",
              likeCount: story.likeCount || 0,
              commentCount: story.commentCount || 0,
              viewCount: story.viewCount || 0,
              chapterCount: story.chapterCount ?? story._count?.chapters ?? undefined,
              readTime: Math.ceil((story.wordCount || 0) / 200),
              date: story.createdAt ? new Date(story.createdAt) : new Date(),
              createdAt: story.createdAt ? new Date(story.createdAt) : new Date(),
              slug: story.slug || undefined,
              tags,
              isMature: story.isMature || false,
              isBookmarked: true,
            }
          })

          setBookmarkedStories(formattedStories)
        } else {
          throw new Error(response.message || "Failed to fetch bookmarked stories")
        }
      } catch (error) {
        logError(error, { context: "Fetching bookmarked stories" })
        toast({
          title: "Error",
          description: "Failed to load your library. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookmarkedStories()
  }, [user, toast])

  // Extract unique genres for filter options like old page had
  const genres = ["all", ...Array.from(new Set(bookmarkedStories
    .filter((story) => story.genre)
    .map((story) => story.genre as string)))]

  // Toggle bookmark callback
  const handleBookmark = (id: string | number) => {
    setBookmarkedStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isBookmarked: !s.isBookmarked } : s))
    )
  }

  // Helper to safely extract author name as string
  const getAuthorName = (author: StoryCardData["author"]): string => {
    if (typeof author === "string") return author
    if (author && typeof author === "object") return author.name || author.username || ""
    return ""
  }

  // Filter and sort stories based on user selections
  const filterStories = () => {
    let filtered = [...bookmarkedStories]

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (story) =>
          story.title.toLowerCase().includes(query) ||
          getAuthorName(story.author).toLowerCase().includes(query) ||
          (typeof story.genre === "string" ? story.genre.toLowerCase().includes(query) : false)
      )
    }

    // Genre filter
    if (filterGenre !== "all") {
      filtered = filtered.filter((story) => story.genre === filterGenre)
    }

    // Sorting options like old page had
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
        break
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "author":
        filtered.sort((a, b) => getAuthorName(a.author).localeCompare(getAuthorName(b.author)))
        break
      case "mostRead":
        filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        break
    }

    return filtered
  }

  const filteredStories = filterStories()

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Header & Filter Options (Old Page Filter UX) */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-semibold">My Library</h1>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {/* Search Library Input */}
              <div className="relative flex-1 sm:w-64">
                <Input
                  placeholder="Search library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-2"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )}
              </div>

              {/* Sort By & Genre Select Dropdowns */}
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                    <SelectItem value="mostRead">Most Read</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterGenre} onValueChange={setFilterGenre}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre === "all" ? "All Genres" : genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Layout: Stories + Sticky Sidebar Ad */}
          <div className="flex gap-6 items-start">

            {/* Main content area */}
            <main className="flex-1 min-w-0">
              {loading ? (
                <div>
                  <div className="text-sm text-muted-foreground mb-4">Loading your library...</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <StoryCardSkeleton key={`skeleton-${i}`} variant="landscape-list" />
                    ))}
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Story count */}
                    <p className="text-sm text-muted-foreground mb-4">
                      {filteredStories.length} {filteredStories.length === 1 ? "story" : "stories"} found
                    </p>

                    {/* Story grid / empty state */}
                    {filteredStories.length > 0 ? (
                      <StoryGrid
                        stories={filteredStories}
                        viewMode="grid"
                        onBookmark={handleBookmark}
                      />
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center py-12 bg-muted/30 rounded-lg"
                      >
                        <h3 className="text-xl font-semibold mb-2">No stories found</h3>
                        <p className="text-muted-foreground mb-6">
                          {searchQuery || filterGenre !== "all"
                            ? "Try adjusting your search or filters."
                            : "Your library is empty. Start browsing and save stories to read later!"}
                        </p>
                        <Button asChild>
                          <Link href="/browse">Browse Stories</Link>
                        </Button>
                      </motion.div>
                    )}

                    {/* Bottom banner ad */}
                    <div className="mt-8">
                      <AdBanner
                        type="banner"
                        className="w-full max-w-[728px] h-[90px] mx-auto"
                        slot="6596765108"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </main>

            {/* Right sticky sidebar ad (hidden on mobile/tablet) */}
            <aside className="hidden xl:block w-[300px] shrink-0">
              <div className="sticky top-24 flex flex-col gap-6">
                <AdBanner
                  type="sidebar"
                  className="w-[300px] min-h-[250px]"
                  slot="6596765108"
                />
                <div className="mt-4">
                  <AdBanner
                    type="sidebar"
                    className="w-[300px] min-h-[250px]"
                    slot="6596765108"
                  />
                </div>
              </div>
            </aside>

          </div>
        </div>
      </main>
    </div>
  )
}
