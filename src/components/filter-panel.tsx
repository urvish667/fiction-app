"use client"
import { useState, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Loader2 } from "lucide-react"

// Default genres to use while loading or if API fails
const defaultGenres = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Horror",
  "Adventure",
  "Historical Fiction",
  "Young Adult",
  "Thriller",
  "Poetry",
  "Drama",
  "Comedy",
]

interface FilterPanelProps {
  selectedGenres: string[]
  onGenreChange: (genres: string[]) => void
  sortBy: string
  onSortChange: (sort: string) => void
}

export default function FilterPanel({ selectedGenres, onGenreChange, sortBy, onSortChange }: FilterPanelProps) {
  const [genres, setGenres] = useState<string[]>(defaultGenres)
  const [loadingGenres, setLoadingGenres] = useState(false)

  // Fetch genres from the API
  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true)
      try {
        // In a real implementation, this would be an API call
        // For now, we'll just use the default genres
        // This is where you would add the API call to get genres

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Use default genres for now
        setGenres(defaultGenres)
      } catch (error) {
        console.error("Error fetching genres:", error)
        // Fall back to default genres if API fails
        setGenres(defaultGenres)
      } finally {
        setLoadingGenres(false)
      }
    }

    fetchGenres()
  }, [])
  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenreChange(selectedGenres.filter((g) => g !== genre))
    } else {
      onGenreChange([...selectedGenres, genre])
    }
  }

  const clearAllFilters = () => {
    onGenreChange([])
    onSortChange("newest")
  }

  return (
    <div className="bg-card rounded-lg border p-4 mb-6 md:mb-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Filters</h3>
        {(selectedGenres.length > 0 || sortBy !== "newest") && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 text-xs">
            Clear all
          </Button>
        )}
      </div>

      {/* Selected filters */}
      {selectedGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedGenres.map((genre) => (
            <Badge key={genre} variant="secondary" className="flex items-center gap-1">
              {genre}
              <Button variant="ghost" size="icon" onClick={() => handleGenreToggle(genre)} className="h-4 w-4 p-0 ml-1">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {genre} filter</span>
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <Accordion type="multiple" defaultValue={["sort", "genres"]} className="w-full">
        <AccordionItem value="sort">
          <AccordionTrigger>Sort By</AccordionTrigger>
          <AccordionContent>
            <RadioGroup value={sortBy} onValueChange={onSortChange}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="newest" id="newest" />
                <Label htmlFor="newest">Newest</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="popular" id="popular" />
                <Label htmlFor="popular">Most Popular</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mostRead" id="mostRead" />
                <Label htmlFor="mostRead">Most Read</Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="genres">
          <AccordionTrigger>Genres</AccordionTrigger>
          <AccordionContent>
            {loadingGenres ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                <span className="text-sm">Loading genres...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {genres.map((genre) => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox
                      id={`genre-${genre}`}
                      checked={selectedGenres.includes(genre)}
                      onCheckedChange={() => handleGenreToggle(genre)}
                    />
                    <Label htmlFor={`genre-${genre}`} className="text-sm">
                      {genre}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

