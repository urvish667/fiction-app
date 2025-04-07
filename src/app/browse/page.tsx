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
import { Filter, Grid, List } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { Story } from "@/lib/types"

// Sample data - in a real app, this would come from an API
import { sampleStories } from "@/lib/sample-data"

export default function BrowsePage() {
  const [stories, setStories] = useState<Story[]>(sampleStories)
  const [filteredStories, setFilteredStories] = useState<Story[]>(sampleStories)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const storiesPerPage = 12

  const isMobile = useMediaQuery("(max-width: 768px)")

  // Filter stories based on search query, genres, and sort option
  useEffect(() => {
    let results = [...stories]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (story) =>
          story.title.toLowerCase().includes(query) ||
          story.author.toLowerCase().includes(query) ||
          story.excerpt.toLowerCase().includes(query),
      )
    }

    // Apply genre filter
    if (selectedGenres.length > 0) {
      results = results.filter((story) => selectedGenres.includes(story.genre))
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        results.sort((a, b) => b.date.getTime() - a.date.getTime())
        break
      case "popular":
        results.sort((a, b) => b.likes - a.likes)
        break
      case "mostRead":
        results.sort((a, b) => b.reads - a.reads)
        break
    }

    setFilteredStories(results)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchQuery, selectedGenres, sortBy, stories])

  // Calculate pagination
  const indexOfLastStory = currentPage * storiesPerPage
  const indexOfFirstStory = indexOfLastStory - storiesPerPage
  const currentStories = filteredStories.slice(indexOfFirstStory, indexOfLastStory)
  const totalPages = Math.ceil(filteredStories.length / storiesPerPage)

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Handle genre selection
  const handleGenreChange = (genres: string[]) => {
    setSelectedGenres(genres)
  }

  // Handle sort selection
  const handleSortChange = (sort: string) => {
    setSortBy(sort)
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
                {/* Results count and info */}
                <div className="mb-4 text-sm text-muted-foreground">
                  {filteredStories.length} {filteredStories.length === 1 ? "story" : "stories"} found
                  {searchQuery && <span> for &quot;{searchQuery}&quot;</span>}
                  {selectedGenres.length > 0 && <span> in {selectedGenres.join(", ")}</span>}
                </div>

                {/* Story Grid with Ads */}
                {filteredStories.length > 0 ? (
                  <>
                    <StoryGrid stories={currentStories} viewMode={viewMode} showAds={true} />

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

