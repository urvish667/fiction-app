"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { X, SlidersHorizontal, Loader2 } from "lucide-react"
import { SearchBar } from "@/components/common"
import { GENRES, LANGUAGES } from "@/constants/genres-and-languages"
import { GenreSelector } from "./genre-selector"
import { StatusSortDropdown } from "./status-sort-dropdown"
import { TagMultiSelect } from "./tag-multi-select"
import { LanguageSelector } from "./language-selector"
import type { FilterBarProps, GenreOption } from "../../types/browse.types"

const genresWithIds: GenreOption[] = GENRES.map((genre, index) => ({
  id: `genre-${index}-${genre.slug}`,
  name: genre.name,
  slug: genre.slug,
}))

const languagesFromConstants = LANGUAGES.map(lang => lang.name)

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedGenres,
  onGenreChange,
  selectedTags,
  onTagChange,
  availableTags,
  selectedLanguage,
  onLanguageChange,
  storyStatus,
  onStatusChange,
  sortBy,
  onSortChange,
}: FilterBarProps) {
  const [genres] = useState<GenreOption[]>(genresWithIds)
  const [languages] = useState<string[]>(languagesFromConstants)
  const [mobileTagSearch, setMobileTagSearch] = useState("")

  const handleGenreToggle = (genreSlug: string) => {
    if (selectedGenres.includes(genreSlug)) {
      onGenreChange(selectedGenres.filter(slug => slug !== genreSlug))
      return
    }
    onGenreChange([...selectedGenres, genreSlug])
  }

  const handleTagToggle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagChange(selectedTags.filter(t => t !== tagName))
      return
    }
    onTagChange([...selectedTags, tagName])
  }

  const handleSearch = (query: string, type?: "genre" | "tag" | "story") => {
    if (type === "genre") {
      const genre = genres.find(g => g.name === query)
      if (genre) {
        onGenreChange([genre.slug])
      }
      return
    }

    if (type === "tag") {
      const tag = availableTags.find(t => t.name === query)
      if (tag) {
        onTagChange([tag.name])
      }
      return
    }

    onSearchChange(query)
  }

  const clearAllFilters = () => {
    onSearchChange("")
    onGenreChange([])
    onTagChange([])
    onLanguageChange("")
    onStatusChange("all")
    onSortChange("newest")
  }

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedGenres.length > 0 ||
    selectedTags.length > 0 ||
    selectedLanguage ||
    storyStatus !== "all" ||
    sortBy !== "newest"
  )

  const activeFilterCount =
    selectedGenres.length +
    selectedTags.length +
    (selectedLanguage ? 1 : 0) +
    (storyStatus !== "all" ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0)

  const mobileFilteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(mobileTagSearch.toLowerCase())
  )

  return (
    <div className="w-full space-y-4">
      {/* Search Bar with Suggestions */}
      <SearchBar
        onSearch={handleSearch}
        defaultValue={searchQuery}
        className="w-full"
        placeholder="Search stories, authors, genres, or tags..."
      />

      {/* Mobile Filter Trigger & Drawer */}
      <div className="flex sm:hidden items-center justify-between gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 text-sm flex-1">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters & Sort</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl px-4 py-6 overflow-y-auto">
            <SheetHeader className="text-left mb-4">
              <SheetTitle className="text-lg font-semibold flex items-center justify-between">
                <span>Filter & Sort Stories</span>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-8">
                    Clear All
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-6 pb-6">
              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Sort By</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "newest", label: "Newest" },
                    { id: "popular", label: "Popular" },
                    { id: "mostRead", label: "Most Read" },
                  ].map(item => (
                    <Button
                      key={item.id}
                      variant={sortBy === item.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSortChange(item.id)}
                      className="text-xs"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Story Status */}
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "ongoing", label: "Ongoing" },
                    { id: "completed", label: "Completed" },
                  ].map(item => (
                    <Button
                      key={item.id}
                      variant={storyStatus === item.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => onStatusChange(item.id as "all" | "ongoing" | "completed")}
                      className="text-xs"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Language</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedLanguage === "" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onLanguageChange("")}
                    className="text-xs"
                  >
                    All
                  </Button>
                  {languages.map(lang => (
                    <Button
                      key={lang}
                      variant={selectedLanguage === lang ? "default" : "outline"}
                      size="sm"
                      onClick={() => onLanguageChange(lang)}
                      className="text-xs"
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Genre */}
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Genres</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                  {genres.map(genre => {
                    const isSelected = selectedGenres.includes(genre.slug)
                    return (
                      <Button
                        key={genre.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleGenreToggle(genre.slug)}
                        className="text-xs"
                      >
                        {genre.name}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Tags</label>
                <Command className="border rounded-md">
                  <CommandInput
                    placeholder="Search tags..."
                    value={mobileTagSearch}
                    onValueChange={setMobileTagSearch}
                  />
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup className="max-h-40 overflow-y-auto">
                    {mobileFilteredTags.map(tag => (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => handleTagToggle(tag.name)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag.name)}
                            onChange={() => handleTagToggle(tag.name)}
                            className="h-4 w-4"
                          />
                          <span>{tag.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </div>
            </div>

            <SheetClose asChild>
              <Button className="w-full mt-4">Apply Filters</Button>
            </SheetClose>
          </SheetContent>
        </Sheet>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-9 text-xs">
            Clear All
          </Button>
        )}
      </div>

      {/* Desktop Filter Dropdowns */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-3">
        <StatusSortDropdown
          sortBy={sortBy}
          onSortChange={onSortChange}
          storyStatus={storyStatus}
          onStatusChange={onStatusChange}
        />

        <GenreSelector
          genres={genres}
          selectedGenres={selectedGenres}
          onGenreToggle={handleGenreToggle}
        />

        <TagMultiSelect
          tags={availableTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
        />

        <LanguageSelector
          languages={languages}
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-9 text-sm">
            <span className="hidden sm:inline">Clear All</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(selectedGenres.length > 0 || selectedTags.length > 0 || selectedLanguage || storyStatus !== "all") && (
        <div className="flex flex-wrap gap-2">
          {selectedGenres.map(slug => {
            const genre = genres.find(g => g.slug === slug)
            if (!genre) return null
            return (
              <Badge key={`genre-${slug}`} variant="secondary" className="flex items-center gap-1">
                <span>{genre.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleGenreToggle(slug)}
                  className="h-4 w-4 p-0 ml-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
          {selectedTags.map(tag => (
            <Badge key={`tag-${tag}`} variant="outline" className="flex items-center gap-1 bg-primary/5">
              <span>{tag}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleTagToggle(tag)}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {selectedLanguage && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-100/50 dark:bg-blue-900/20">
              <span>{selectedLanguage}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onLanguageChange("")}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {storyStatus !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-100/50 dark:bg-green-900/20">
              <span>{storyStatus === "ongoing" ? "Ongoing" : "Completed"}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStatusChange("all")}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
