"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import { StoryGrid, StoryCardSkeleton } from "@/features/story"
import { AdBanner } from "@/components/common"
import { FilterBar } from "./filter-bar/filter-bar"
import { CategoryDescription } from "./category-description"
import { BrowseEmptyState } from "./browse-empty-state"
import { useBrowseFilters } from "../hooks/use-browse-filters"
import type { BrowseContentProps } from "../types/browse.types"

export function BrowseContent({ initialParams, initialData }: BrowseContentProps) {
  const {
    stories,
    loading,
    isFetchingMore,
    error,
    hasMore,
    searchQuery,
    setSearchQuery,
    allGenres,
    selectedGenres,
    setSelectedGenres,
    allTags,
    selectedTags,
    setSelectedTags,
    selectedLanguage,
    setSelectedLanguage,
    storyStatus,
    setStoryStatus,
    sortBy,
    setSortBy,
    totalStories,
    observerTargetRef,
    handleBookmark,
    resetAllFilters,
  } = useBrowseFilters(initialParams, initialData)

  const selectedGenreObject = selectedGenres.length === 1
    ? allGenres.find(g => g.slug === selectedGenres[0])
    : null

  const selectedGenreName = selectedGenreObject?.name || selectedGenres[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex justify-between items-center gap-4 mb-4">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
          Browse Stories
        </h1>
      </div>

      {/* Genre Category Description */}
      {selectedGenres.length === 1 && (
        <CategoryDescription
          genre={selectedGenreName}
          totalStories={totalStories}
          language={selectedLanguage}
          status={storyStatus}
        />
      )}

      {/* Full-width Filter Bar */}
      <div className="mb-6">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedGenres={selectedGenres}
          onGenreChange={setSelectedGenres}
          selectedTags={selectedTags}
          onTagChange={setSelectedTags}
          availableTags={allTags}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          storyStatus={storyStatus}
          onStatusChange={setStoryStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Main Content Area + Sticky Sidebar Ad */}
      <div className="flex gap-6">
        <main className="flex-1 min-w-0">
          {loading ? (
            <div>
              <div className="text-sm text-muted-foreground mb-4">Loading stories...</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <StoryCardSkeleton key={`skeleton-${i}`} variant="landscape-list" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-lg font-semibold text-destructive mb-2">Something went wrong</p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          ) : stories.length === 0 ? (
            <BrowseEmptyState onResetFilters={resetAllFilters} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Story Count */}
                <p className="text-sm text-muted-foreground mb-4">
                  {totalStories.toLocaleString()} {totalStories === 1 ? "story" : "stories"} found
                </p>

                {/* Story Grid */}
                <StoryGrid
                  stories={stories}
                  viewMode="grid"
                  onBookmark={handleBookmark}
                />

                {/* Infinite Scroll Sentinel */}
                <div ref={observerTargetRef} className="my-8 flex flex-col items-center justify-center min-h-[60px]">
                  {isFetchingMore && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground animate-pulse">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading more stories...</span>
                    </div>
                  )}
                  {!hasMore && stories.length > 0 && !loading && (
                    <p className="text-xs text-muted-foreground opacity-70">
                      You&apos;ve reached the end of stories.
                    </p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Right Sticky Sidebar Ad (hidden on mobile/tablet) */}
        <aside className="hidden xl:block w-[300px] shrink-0">
          <div className="sticky top-24 flex flex-col gap-6">
            <AdBanner
              type="sidebar"
              className="w-[300px] min-h-[250px]"
              slot="6596765108"
            />
          </div>
        </aside>
      </div>
    </div>
  )
}

export default BrowseContent
