"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/navbar"
import SearchBar from "@/components/search-bar"
import FilterPanel from "@/components/filter-panel"
import StoryGrid from "@/components/story-grid"
import AdBanner from "@/components/ad-banner"
import Pagination from "@/components/pagination"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Filter, Grid, List, Loader2 } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { StoryService } from "@/services/story-service"
import { useToast } from "@/components/ui/use-toast"

// Define a type that combines the fields from both Story types
type BrowseStory = {
  id: string | number
  title: string
  author: string | { name?: string; username?: string }
  genre?: string
  thumbnail?: string
  coverImage?: string
  excerpt?: string
  description?: string
  likes?: number
  likeCount?: number
  comments?: number
  commentCount?: number
  reads?: number
  readCount?: number
  readTime?: number
  date?: Date
  createdAt?: Date
  updatedAt?: Date
  slug?: string
}

export default function BrowsePage() {
  const { toast } = useToast()
  const [stories, setStories] = useState<BrowseStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStories, setTotalStories] = useState(0)
  const storiesPerPage = 16 // Show max 16 stories per page

  const isMobile = useMediaQuery("(max-width: 768px)")

  // Fetch stories from the API
  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true)
      setError(null)

      try {
        // Prepare API parameters
        const params: {
          page: number;
          limit: number;
          genre?: string;
          search?: string;
          status?: string;
        } = {
          page: currentPage,
          limit: storiesPerPage,
          status: "ongoing" // Only show published stories
        }

        // Add search query if provided
        if (searchQuery) {
          params.search = searchQuery
        }

        // Add genre filter if selected
        if (selectedGenres.length === 1) {
          params.genre = selectedGenres[0]
        }

        // Fetch stories from the API
        const response = await StoryService.getStories(params)

        // Log the raw story data to debug image issues
        console.log('Raw story data from API:', response.stories);

        // Map API response to BrowseStory type
        const formattedStories = response.stories.map((story) => ({
          id: story.id,
          title: story.title,
          author: story.author || "Unknown Author",
          genre: story.genre || "General",
          thumbnail: (story.coverImage && story.coverImage.trim() !== "") ? story.coverImage : "/placeholder.svg",
          coverImage: (story.coverImage && story.coverImage.trim() !== "") ? story.coverImage : "/placeholder.svg",
          excerpt: story.description,
          description: story.description,
          likes: story.likeCount,
          likeCount: story.likeCount,
          comments: story.commentCount,
          commentCount: story.commentCount,
          reads: story.readCount,
          readCount: story.readCount,
          readTime: Math.ceil(story.wordCount / 200), // Estimate read time based on word count
          date: story.createdAt ? new Date(story.createdAt) : new Date(),
          createdAt: story.createdAt ? new Date(story.createdAt) : new Date(),
          updatedAt: story.updatedAt ? new Date(story.updatedAt) : new Date(),
          slug: story.slug
        }));

        // Log the formatted stories to debug image issues
        console.log('Formatted stories with image data:', formattedStories.map(s => ({
          id: s.id,
          title: s.title,
          thumbnail: s.thumbnail,
          coverImage: s.coverImage
        })))

        setStories(formattedStories)
        setTotalPages(response.pagination.totalPages)
        setTotalStories(response.pagination.total)
      } catch (err) {
        console.error("Error fetching stories:", err)
        setError("Failed to load stories. Please try again later.")
        toast({
          title: "Error",
          description: "Failed to load stories. Please try again later.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [currentPage, searchQuery, selectedGenres, sortBy, toast])

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when search changes
  }

  // Handle genre selection
  const handleGenreChange = (genres: string[]) => {
    setSelectedGenres(genres)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle sort selection
  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setCurrentPage(1) // Reset to first page when sort changes
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div className="w-full">
            <h1 className="text-3xl font-bold mb-6">Browse Stories</h1>

            <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
              <SearchBar onSearch={handleSearch} className="w-full sm:w-96" />

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-primary/10" : ""}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-primary/10" : ""}
                >
                  <List className="h-4 w-4" />
                </Button>

                {isMobile && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    className={showFilters ? "bg-primary/10" : ""}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Filter Panel - Hidden on mobile unless toggled */}
              <AnimatePresence>
                {(!isMobile || showFilters) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full md:w-64 md:sticky md:top-20"
                  >
                    <FilterPanel
                      selectedGenres={selectedGenres}
                      onGenreChange={handleGenreChange}
                      sortBy={sortBy}
                      onSortChange={handleSortChange}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content */}
              <div className="flex-1">


                {/* Loading state */}
                {loading ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading stories...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-16">
                    <h3 className="text-xl font-semibold mb-2">Error loading stories</h3>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedGenres([])
                        setSortBy("newest")
                        setCurrentPage(1)
                      }}
                    >
                      Try again
                    </Button>
                  </div>
                ) : stories.length > 0 ? (
                  <>
                    {/* Results count and info */}
                    <div className="mb-4 text-sm text-muted-foreground">
                      {totalStories} {totalStories === 1 ? "story" : "stories"} found
                      {searchQuery && <span> for &quot;{searchQuery}&quot;</span>}
                      {selectedGenres.length > 0 && <span> in {selectedGenres.join(", ")}</span>}
                    </div>

                    {/* Story Grid with Ads */}
                    <StoryGrid stories={stories} viewMode={viewMode} showAds={true} />

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <h3 className="text-xl font-semibold mb-2">No stories found</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedGenres([])
                        setSortBy("newest")
                      }}
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Banner Ad */}
      <div className="sticky bottom-0 w-full z-40">
        <AdBanner type="banner" className="w-full h-16" />
      </div>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}

