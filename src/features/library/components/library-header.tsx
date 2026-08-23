"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import type { LibrarySortOption } from "../types/library.types";

interface LibraryHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: LibrarySortOption;
  setSortBy: (sort: LibrarySortOption) => void;
  filterGenre: string;
  setFilterGenre: (genre: string) => void;
  genres: string[];
}

export function LibraryHeader({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  filterGenre,
  setFilterGenre,
  genres,
}: LibraryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">My Library</h1>

      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
        {/* Search Library Input */}
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
              className="absolute right-0 top-0 h-full px-2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>

        {/* Sort By & Genre Select Dropdowns */}
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as LibrarySortOption)}>
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
        </div>
      </div>
    </div>
  );
}
