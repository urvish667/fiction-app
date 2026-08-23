"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"
import type { GenreOption } from "../../types/browse.types"

interface GenreSelectorProps {
  genres: GenreOption[]
  selectedGenres: string[]
  onGenreToggle: (genreSlug: string) => void
}

export function GenreSelector({ genres, selectedGenres, onGenreToggle }: GenreSelectorProps) {
  return (
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
        {genres.map(genre => (
          <DropdownMenuCheckboxItem
            key={genre.id}
            checked={selectedGenres.includes(genre.slug)}
            onCheckedChange={() => onGenreToggle(genre.slug)}
          >
            {genre.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
