"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Grid, List, X } from "lucide-react"
import Navbar from "@/components/navbar"
import StoryCard from "@/components/story-card"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import { StoryService } from "@/services/story-service"
import { useToast } from "@/components/ui/use-toast"

export default function LibraryPage() {
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterGenre, setFilterGenre] = useState("all")
  const [bookmarkedStories, setBookmarkedStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [genres, setGenres] = useState<string[]>(["all"])

  // Fetch bookmarked stories from API
  useEffect(() => {
    const fetchBookmarkedStories = async () => {
      try {
        setLoading(true)
        const response = await StoryService.getBookmarkedStories()

        // Log the raw story data to debug genre information
        console.log('Raw bookmarked stories data:', response.stories);

        // Format stories to ensure they have all required fields
        const formattedStories = response.stories.map((story: any) => {
          // Extract genre name from genre object if it exists
          let genreName = "General";
          if (story.genre && typeof story.genre === 'object' && story.genre.name) {
            genreName = story.genre.name;
          } else if (typeof story.genre === 'string') {
            genreName = story.genre;
          }

          return {
            ...story,
            author: story.author?.name || story.author?.username || "Unknown",
            excerpt: story.description || "",
            likes: story.likeCount || 0,
            comments: story.commentCount || 0,
            reads: story.readCount || 0,
            date: new Date(story.createdAt),
            genre: genreName
          };
        });

        setBookmarkedStories(formattedStories)

        // Extract unique genres for filter
        const uniqueGenres = ["all", ...new Set(formattedStories
          .filter((story: any) => story.genre)
          .map((story: any) => story.genre))]
        setGenres(uniqueGenres)
      } catch (error) {
        console.error("Error fetching bookmarked stories:", error)
        toast({
          title: "Error",
          description: "Failed to load your library. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookmarkedStories()

  }, [toast])

  // Filter and sort stories based on user selections
  const filterStories = () => {
    let filtered = [...bookmarkedStories]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (story) =>
          story.title.toLowerCase().includes(query) ||
          (typeof story.author === 'string' ? story.author.toLowerCase().includes(query) :
           (story.author?.name?.toLowerCase().includes(query) || story.author?.username?.toLowerCase().includes(query))) ||
          (story.genre?.toLowerCase().includes(query) || false),
      )
    }

    // Apply genre filter
    if (filterGenre !== "all") {
      filtered = filtered.filter((story) => story.genre === filterGenre)
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "author":
        const getAuthorName = (story: any) => {
          if (typeof story.author === 'string') return story.author
          return story.author?.name || story.author?.username || ''
        }
        filtered.sort((a, b) => getAuthorName(a).localeCompare(getAuthorName(b)))
        break
      case "mostRead":
        filtered.sort((a, b) => (b.readCount || b.reads || 0) - (a.readCount || a.reads || 0))
        break
    }

    return filtered
  }

  const filteredStories = filterStories()

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">My Library</h1>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
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
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>

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

              <div className="flex">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-primary/10" : ""}
                >
                  <Grid className="h-4 w-4" />
                  <span className="sr-only">Grid view</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-primary/10" : ""}
                >
                  <List className="h-4 w-4" />
                  <span className="sr-only">List view</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className={`grid gap-6 ${
              viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
            }`}>
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`skeleton-${index}`}>
                  <StoryCardSkeleton viewMode={viewMode} />
                </div>
              ))}
            </div>
          ) : (
            <LibraryContent stories={filteredStories} viewMode={viewMode} searchQuery={searchQuery} />
          )}
        </div>
      </main>
    </div>
  )
}

interface LibraryContentProps {
  stories: any[]
  viewMode: "grid" | "list"
  searchQuery: string
}

function LibraryContent({ stories, viewMode, searchQuery }: LibraryContentProps) {
  return (
    <>
      {stories.length > 0 ? (
        <motion.div
          layout
          className={`grid gap-6 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          }`}
        >
          {stories.map((story) => (
            <motion.div
              key={story.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StoryCard story={story} viewMode={viewMode} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12 bg-muted/30 rounded-lg"
        >
          <h3 className="text-xl font-semibold mb-2">No stories found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "Try adjusting your search or filters."
              : "Your library is empty. Start browsing and save stories to read later!"}
          </p>
          <Button asChild>
            <Link href="/browse">Browse Stories</Link>
          </Button>
        </motion.div>
      )}
    </>
  )
}

