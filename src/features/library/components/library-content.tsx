"use client";

import { motion, AnimatePresence } from "framer-motion";
import { StoryGrid, StoryCardSkeleton } from "@/features/story";
import { AdBanner } from "@/components/common";

import { useLibrary } from "../hooks/use-library";
import { LibraryHeader } from "./library-header";
import { LibraryEmptyState } from "./library-empty-state";

export function LibraryContent() {
  const {
    filteredStories,
    loading,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterGenre,
    setFilterGenre,
    genres,
    handleBookmark,
  } = useLibrary();

  const hasFilters = Boolean(searchQuery || filterGenre !== "all");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <LibraryHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterGenre={filterGenre}
        setFilterGenre={setFilterGenre}
        genres={genres}
      />

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
                  <LibraryEmptyState hasFilters={hasFilters} />
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
  );
}
