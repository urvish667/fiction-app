"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
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
import { Search, ChevronDown, X, Loader2 } from "lucide-react"
import { logError } from "@/lib/error-logger"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

// Search suggestions type
interface SearchSuggestion {
  genres: { id: string; name: string; slug: string }[]
  tags: { id: string; name: string; slug: string }[]
  stories: { id: string; title: string; slug: string }[]
}

// Default languages
const defaultLanguages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Korean",
  "Russian",
  "Arabic",
  "Hindi",
]

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
  const [genres, setGenres] = useState<GenreOption[]>([])
  const [tags, setTags] = useState<TagOption[]>([])
  const [languages, setLanguages] = useState<string[]>(defaultLanguages)
  const [loadingGenres, setLoadingGenres] = useState(false)
  const [loadingTags, setLoadingTags] = useState(false)
  const [loadingLanguages, setLoadingLanguages] = useState(false)
  const [tagSearchOpen, setTagSearchOpen] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion | null>(null)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Fetch genres from the API
  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true)
      try {
        const response = await fetch("/api/genres")
        if (response.ok) {
          const data = await response.json()
          const genresWithSlugs = data.map((genre: any) => ({
            ...genre,
            slug: genre.slug || genre.name.toLowerCase().replace(/\s+/g, "-"),
          }))
          setGenres(genresWithSlugs)
        }
      } catch (error) {
        logError(error, { context: "Fetching genres" })
      } finally {
        setLoadingGenres(false)
      }
    }

    fetchGenres()
  }, [])

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

  // Fetch languages from the API
  useEffect(() => {
    const fetchLanguages = async () => {
      setLoadingLanguages(true)
      try {
        const response = await fetch("/api/languages")
        if (response.ok) {
          const data = await response.json()
          const languageNames = data.map((language: { name: string }) => language.name)
          setLanguages(languageNames)
        } else {
          setLanguages(defaultLanguages)
        }
      } catch (error) {
        logError(error, { context: "Fetching languages" })
        setLanguages(defaultLanguages)
      } finally {
        setLoadingLanguages(false)
      }
    }

    fetchLanguages()
  }, [])

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (localSearchQuery.length > 1) {
        try {
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(localSearchQuery)}`)
          if (response.ok) {
            const data = await response.json()
            setSearchSuggestions(data)
            setShowSearchSuggestions(true)
          }
        } catch (error) {
          console.error("Failed to fetch suggestions:", error)
        }
      } else {
        setShowSearchSuggestions(false)
        setSearchSuggestions(null)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [localSearchQuery])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchQuery, onSearchChange])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  const handleSearchSelect = (value: string, type: "genre" | "tag" | "story") => {
    if (type === "genre") {
      const genre = genres.find((g) => g.name === value)
      if (genre) {
        onGenreChange([genre.slug])
        setLocalSearchQuery("")
        setShowSearchSuggestions(false)
      }
    } else if (type === "tag") {
      const tag = tags.find((t) => t.name === value)
      if (tag) {
        onTagChange([tag.name])
        setLocalSearchQuery("")
        setShowSearchSuggestions(false)
      }
    } else {
      setLocalSearchQuery(value)
      setShowSearchSuggestions(false)
      onSearchChange(value)
    }
  }

  const clearSearch = () => {
    setLocalSearchQuery("")
    setShowSearchSuggestions(false)
    onSearchChange("")
  }

  const clearAllFilters = () => {
    setLocalSearchQuery("")
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
      <div ref={searchRef} className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
        <Input
          type="text"
          placeholder="Search stories, authors, genres, or tags..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          onFocus={() => localSearchQuery.length > 1 && setShowSearchSuggestions(true)}
          className="w-full pl-10 pr-12 h-12 text-base"
          aria-label="Search for stories, authors, genres, or tags"
        />
        {localSearchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 h-10 w-10 z-10"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
        
        {/* Search Suggestions Dropdown */}
        <AnimatePresence>
          {showSearchSuggestions && searchSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-96 overflow-y-auto"
            >
              {searchSuggestions.stories.length > 0 && (
                <div>
                  <h3 className="px-4 py-2 text-sm font-semibold text-muted-foreground">Stories</h3>
                  <ul>
                    {searchSuggestions.stories.map((story) => (
                      <li
                        key={story.id}
                        onClick={() => handleSearchSelect(story.title, "story")}
                        className="px-4 py-2 cursor-pointer hover:bg-accent transition-colors"
                      >
                        {story.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {searchSuggestions.genres.length > 0 && (
                <div>
                  <h3 className="px-4 py-2 text-sm font-semibold text-muted-foreground">Genres</h3>
                  <ul>
                    {searchSuggestions.genres.map((genre) => (
                      <li
                        key={genre.id}
                        onClick={() => handleSearchSelect(genre.name, "genre")}
                        className="px-4 py-2 cursor-pointer hover:bg-accent transition-colors"
                      >
                        {genre.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {searchSuggestions.tags.length > 0 && (
                <div>
                  <h3 className="px-4 py-2 text-sm font-semibold text-muted-foreground">Tags</h3>
                  <ul>
                    {searchSuggestions.tags.map((tag) => (
                      <li
                        key={tag.id}
                        onClick={() => handleSearchSelect(tag.name, "tag")}
                        className="px-4 py-2 cursor-pointer hover:bg-accent transition-colors"
                      >
                        {tag.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {searchSuggestions.stories.length === 0 && 
               searchSuggestions.genres.length === 0 && 
               searchSuggestions.tags.length === 0 && (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                  No suggestions found
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
            {loadingGenres ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                {genres.map((genre) => (
                  <DropdownMenuCheckboxItem
                    key={genre.id}
                    checked={selectedGenres.includes(genre.slug)}
                    onCheckedChange={() => handleGenreToggle(genre.slug)}
                  >
                    {genre.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
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
              {loadingLanguages ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                languages.map((language) => (
                  <DropdownMenuRadioItem key={language} value={language}>
                    {language}
                  </DropdownMenuRadioItem>
                ))
              )}
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
