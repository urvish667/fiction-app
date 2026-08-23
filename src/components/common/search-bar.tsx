"use client"

import React, { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SearchService } from "@/lib/api/search"

export interface Suggestion {
  genres: { id: string; name: string; slug?: string }[]
  tags: { id: string; name: string; slug?: string }[]
  stories: { id: string; title: string; slug?: string }[]
}

const suggestionCache = new Map<string, Suggestion>()

function unwrapApiData<T>(apiResponseData: any): T {
  if (typeof apiResponseData === "object" && apiResponseData !== null && "data" in apiResponseData) {
    return apiResponseData.data as T
  }
  return apiResponseData as T
}

export interface SearchBarProps {
  onSearch: (query: string, type?: "genre" | "tag" | "story") => void
  className?: string
  placeholder?: string
  defaultValue?: string
}

export function SearchBar({
  onSearch,
  className = "",
  placeholder = "Search stories, authors, genres, or tags...",
  defaultValue = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length <= 1) {
        setShowSuggestions(false)
        setSuggestions(null)
        return
      }

      if (suggestionCache.has(query)) {
        setSuggestions(suggestionCache.get(query)!)
        setShowSuggestions(true)
        return
      }

      try {
        setShowSuggestions(true)
        setIsLoading(true)
        const response = await SearchService.getSuggestions(query)
        if (response.success && response.data) {
          const data = unwrapApiData<Suggestion>(response.data)
          suggestionCache.set(query, data)
          setSuggestions(data)
          return
        }

        setShowSuggestions(false)
        setSuggestions(null)
      } catch {
        setShowSuggestions(false)
        setSuggestions(null)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (value: string, type: "genre" | "tag" | "story") => {
    if (type === "story") {
      setQuery(value)
    }
    onSearch(value, type)
    setShowSuggestions(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
    setShowSuggestions(false)
  }

  const handleClear = () => {
    setQuery("")
    onSearch("")
    setShowSuggestions(false)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pr-9 pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      <AnimatePresence>
        {showSuggestions && suggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg overflow-hidden"
          >
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading suggestions...
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {/* Genres */}
                {suggestions.genres?.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
                      Genres
                    </div>
                    {suggestions.genres.map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => handleSelect(genre.name, "genre")}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground"
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {suggestions.tags?.length > 0 && (
                  <div className="p-2 border-t">
                    <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
                      Tags
                    </div>
                    {suggestions.tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleSelect(tag.name, "tag")}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Stories */}
                {suggestions.stories?.length > 0 && (
                  <div className="p-2 border-t">
                    <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
                      Stories
                    </div>
                    {suggestions.stories.map((story) => (
                      <button
                        key={story.id}
                        onClick={() => handleSelect(story.title, "story")}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground"
                      >
                        {story.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* No suggestions */}
                {!suggestions.genres?.length &&
                  !suggestions.tags?.length &&
                  !suggestions.stories?.length && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No suggestions found
                    </div>
                  )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchBar
