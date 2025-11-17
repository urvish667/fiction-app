"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchService } from "@/lib/api/search";

interface Suggestion {
  genres: { id: string; name: string; slug?: string }[];
  tags: { id: string; name: string; slug?: string }[];
  stories: { id: string; title: string; slug?: string }[];
}

// Helper function to handle both flat and nested API response data structures
function unwrapApiData<T>(apiResponseData: any): T {
  if (typeof apiResponseData === 'object' && apiResponseData !== null && 'data' in apiResponseData) {
    return apiResponseData.data as T;
  }
  return apiResponseData as T;
}

interface SearchBarProps {
  onSearch: (query: string, type?: "genre" | "tag" | "story") => void;
  className?: string;
  placeholder?: string;
  defaultValue?: string;
}

export default function SearchBar({
  onSearch,
  className = "",
  placeholder = "Search stories, authors, genres, or tags...",
  defaultValue = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length > 1) {
        try {
          setShowSuggestions(true);
          setIsLoading(true);
          const response = await SearchService.getSuggestions(query);
          if (response.success && response.data) {
            // Handle both flat and nested data structures
            const data = unwrapApiData<Suggestion>(response.data);
            setSuggestions(data);
          } else {
            setShowSuggestions(false);
            setSuggestions(null);
          }
        } catch (error) {
          setShowSuggestions(false);
          setSuggestions(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setShowSuggestions(false);
        setSuggestions(null);
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string, type: "genre" | "tag" | "story") => {
    // For stories, set the query to the title
    // For genres/tags, we'll let the parent handle it via the callback
    if (type === "story") {
      setQuery(value);
    } else {
      // Clear query for genre/tag selection as they're handled by filters
      setQuery("");
    }
    setShowSuggestions(false);
    onSearch(value, type);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(query);
  };

  const clearSearch = () => {
    setQuery("");
    setShowSuggestions(false);
    onSearch("");
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          className="pr-16 h-12 text-base"
          aria-label="Search for stories, authors, genres, or tags"
          title="Try searching for story titles, author names, genres like 'Fantasy', or tags like 'magic'"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-8 top-0 h-full"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
        <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-0 h-full">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </form>
      <AnimatePresence>
        {showSuggestions && (isLoading || suggestions) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg"
          >
            {isLoading ? (
              <div className="px-4 py-2">Searching...</div>
            ) : suggestions ? (
              <>
                {suggestions.stories && suggestions.stories.length > 0 && (
                  <div>
                    <h3 className="px-4 py-2 text-sm font-bold text-muted-foreground">Stories</h3>
                    <ul>
                      {suggestions.stories.map((story) => (
                        <li
                          key={story.id}
                          onClick={() => handleSelect(story.title, "story")}
                          className="px-4 py-2 cursor-pointer hover:bg-accent"
                        >
                          {story.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestions.genres && suggestions.genres.length > 0 && (
                  <div>
                    <h3 className="px-4 py-2 text-sm font-bold text-muted-foreground">Genres</h3>
                    <ul>
                      {suggestions.genres.map((genre) => (
                        <li
                          key={genre.id}
                          onClick={() => handleSelect(genre.name, "genre")}
                          className="px-4 py-2 cursor-pointer hover:bg-accent"
                        >
                          {genre.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestions.tags && suggestions.tags.length > 0 && (
                  <div>
                    <h3 className="px-4 py-2 text-sm font-bold text-muted-foreground">Tags</h3>
                    <ul>
                      {suggestions.tags.map((tag) => (
                        <li
                          key={tag.id}
                          onClick={() => handleSelect(tag.name, "tag")}
                          className="px-4 py-2 cursor-pointer hover:bg-accent"
                        >
                          {tag.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
