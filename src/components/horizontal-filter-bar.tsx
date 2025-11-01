"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, X, Loader2 } from "lucide-react"
import { logError } from "@/lib/error-logger"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { GENRES, LANGUAGES } from "@/lib/constants/genres-and-languages"
import SearchBar from "@/components/search-bar"

// Genre option type
interface GenreOption {
  id: string
  name: string
  slug: string
}

// Tag option type
interface TagOption {
  id: string
  name: string
  slug: string
}


// Map constants to component format (add IDs for compatibility)
const genresWithIds: GenreOption[] = GENRES.map((genre, index) => ({
  id: `genre-${index}-${genre.slug}`,
  name: genre.name,
  slug: genre.slug,
}))

const languagesFromConstants = LANGUAGES.map(lang => lang.name)

interface HorizontalFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedGenres: string[]
  onGenreChange: (genres: string[]) => void
  selectedTags: string[]
  onTagChange: (tags: string[]) => void
  selectedLanguage: string
  onLanguageChange: (language: string) => void
  storyStatus: "all" | "ongoing" | "completed"
  onStatusChange: (status: "all" | "ongoing" | "completed") => void
  sortBy: string
  onSortChange: (sort: string) => void
}

export default function HorizontalFilterBar({
  searchQuery,
  onSearchChange,
  selectedGenres,
  onGenreChange,
  selectedTags,
  onTagChange,
  selectedLanguage,
  onLanguageChange,
  storyStatus,
  onStatusChange,
  sortBy,
  onSortChange,
}: HorizontalFilterBarProps) {
  const [genres] = useState<GenreOption[]>(genresWithIds)
  const [tags, setTags] = useState<TagOption[]>([])
  const [languages] = useState<string[]>(languagesFromConstants)
  const [loadingTags, setLoadingTags] = useState(false)
  const [tagSearchOpen, setTagSearchOpen] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState("")

  // Genres are now loaded from constants - no API call needed

  // Fetch tags from the API
  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true)
      try {
        const response = await fetch("/api/tags")
        if (response.ok) {
          const data = await response.json()
          setTags(data)
        }
      } catch (error) {
        logError(error, { context: "Fetching tags" })
      } finally {
        setLoadingTags(false)
      }
    }

    fetchTags()
  }, [])

  // Languages are now loaded from constants - no API call needed

  const handleGenreToggle = (genreSlug: string) => {
    if (selectedGenres.includes(genreSlug)) {
      onGenreChange(selectedGenres.filter((slug) => slug !== genreSlug))
    } else {
      onGenreChange([...selectedGenres, genreSlug])
    }
  }

  const handleTagToggle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagChange(selectedTags.filter((t) => t !== tagName))
    } else {
      onTagChange([...selectedTags, tagName])
    }
  }

  const handleSearch = (query: string, type?: "genre" | "tag" | "story") => {
    if (type === "genre") {
      const genre = genres.find((g) => g.name === query)
      if (genre) {
        onGenreChange([genre.slug])
      }
    } else if (type === "tag") {
      const tag = tags.find((t) => t.name === query)
      if (tag) {
        onTagChange([tag.name])
      }
    } else {
      // Regular search query
      onSearchChange(query)
    }
  }

  const clearAllFilters = () => {
    onSearchChange("")
    onGenreChange([])
    onTagChange([])
    onLanguageChange("")
    onStatusChange("all")
    onSortChange("newest")
  }

  const hasActiveFilters =
    searchQuery ||
    selectedGenres.length > 0 ||
    selectedTags.length > 0 ||
    selectedLanguage ||
    storyStatus !== "all" ||
    sortBy !== "newest"

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  )

  const getSortLabel = () => {
    switch (sortBy) {
      case "popular":
        return "Popular"
      case "mostRead":
        return "Most Read"
      default:
        return "Newest"
    }
  }

  const getStatusLabel = () => {
    switch (storyStatus) {
      case "ongoing":
        return "Ongoing"
      case "completed":
        return "Completed"
      default:
        return "All"
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Search Bar with Suggestions */}
      <SearchBar
        onSearch={handleSearch}
        defaultValue={searchQuery}
        className="w-full"
        placeholder="Search stories, authors, genres, or tags..."
      />

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Sort By Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 text-sm">
              <span className="hidden sm:inline">Sort By: </span>{getSortLabel()}
              <ChevronDown className="ml-1 sm:ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sortBy} onValueChange={onSortChange}>
              <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="popular">Popular</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="mostRead">Most Read</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Story Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 text-sm">
              <span className="hidden sm:inline">Status: </span>{getStatusLabel()}
              <ChevronDown className="ml-1 sm:ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Story Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup 
              value={storyStatus} 
              onValueChange={(value) => onStatusChange(value as "all" | "ongoing" | "completed")}
            >
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="ongoing">Ongoing</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Genre Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 text-sm">
              Genre
              {selectedGenres.length > 0 && (
                <Badge variant="secondary" className="ml-1 sm:ml-2 px-1.5 py-0 text-xs">
                  {selectedGenres.length}
                </Badge>
              )}
              <ChevronDown className="ml-1 sm:ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Select Genres</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {genres.map((genre) => (
              <DropdownMenuCheckboxItem
                key={genre.id}
                checked={selectedGenres.includes(genre.slug)}
                onCheckedChange={() => handleGenreToggle(genre.slug)}
              >
                {genre.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tags Dropdown with Search */}
        <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 text-sm">
              Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-1 sm:ml-2 px-1.5 py-0 text-xs">
                  {selectedTags.length}
                </Badge>
              )}
              <ChevronDown className="ml-1 sm:ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search tags..."
                value={tagSearchQuery}
                onValueChange={setTagSearchQuery}
              />
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto">
                {loadingTags ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  filteredTags.map((tag) => (
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
                  ))
                )}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Language Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 text-sm">
              <span className="hidden sm:inline">Language: </span>
              <span className="sm:hidden">Lang: </span>
              {selectedLanguage || "All"}
              <ChevronDown className="ml-1 sm:ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Select Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={selectedLanguage} onValueChange={onLanguageChange}>
              <DropdownMenuRadioItem value="">All</DropdownMenuRadioItem>
              {languages.map((language) => (
                <DropdownMenuRadioItem key={language} value={language}>
                  {language}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear All Filters Button */}
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
          {selectedGenres.map((slug) => {
            const genre = genres.find((g) => g.slug === slug)
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
          {selectedTags.map((tag) => (
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
