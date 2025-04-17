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

// Default tags to use while loading or if API fails
const defaultTags = [
  "magic",
  "adventure",
  "romance",
  "mystery",
  "thriller",
  "dystopian",
  "dragons",
  "space",
  "time-travel",
  "supernatural",
  "historical",
  "coming-of-age",
]

// Default languages to use while loading or if API fails
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

interface FilterPanelProps {
  selectedGenres: string[]
  onGenreChange: (genres: string[]) => void
  selectedTags?: string[]
  onTagChange?: (tags: string[]) => void
  selectedLanguage?: string
  onLanguageChange?: (language: string) => void
  storyStatus?: "all" | "ongoing" | "completed"
  onStatusChange?: (status: "all" | "ongoing" | "completed") => void
  sortBy: string
  onSortChange: (sort: string) => void
}

export default function FilterPanel({
  selectedGenres,
  onGenreChange,
  selectedTags = [],
  onTagChange,
  selectedLanguage = "",
  onLanguageChange,
  storyStatus = "all",
  onStatusChange,
  sortBy,
  onSortChange
}: FilterPanelProps) {
  const [genres, setGenres] = useState<string[]>(defaultGenres)
  const [tags, setTags] = useState<string[]>(defaultTags)
  const [languages, setLanguages] = useState<string[]>(defaultLanguages)
  const [loadingGenres, setLoadingGenres] = useState(false)
  const [loadingTags, setLoadingTags] = useState(false)
  const [loadingLanguages, setLoadingLanguages] = useState(false)

  // Fetch genres from the API
  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true)
      try {
        // Fetch genres from the API
        const response = await fetch('/api/genres')
        if (response.ok) {
          const data = await response.json()
          // Extract genre names from the response
          const genreNames = data.map((genre: { name: string }) => genre.name)
          setGenres(genreNames)
        } else {
          // Fall back to default genres if API fails
          setGenres(defaultGenres)
        }
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

  // Fetch tags from the API
  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true)
      try {
        // Fetch popular tags from the API
        const response = await fetch('/api/tags')
        if (response.ok) {
          const data = await response.json()
          // Extract tag names from the response
          const tagNames = data.map((tag: { name: string }) => tag.name)
          setTags(tagNames)
        } else {
          // Fall back to default tags if API fails
          setTags(defaultTags)
        }
      } catch (error) {
        console.error("Error fetching tags:", error)
        // Fall back to default tags if API fails
        setTags(defaultTags)
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
        // Fetch languages from the API
        const response = await fetch('/api/languages')
        if (response.ok) {
          const data = await response.json()
          // Extract language names from the response
          const languageNames = data.map((language: { name: string }) => language.name)
          setLanguages(languageNames)
        } else {
          // Fall back to default languages if API fails
          setLanguages(defaultLanguages)
        }
      } catch (error) {
        console.error("Error fetching languages:", error)
        // Fall back to default languages if API fails
        setLanguages(defaultLanguages)
      } finally {
        setLoadingLanguages(false)
      }
    }

    fetchLanguages()
  }, [])
  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenreChange(selectedGenres.filter((g) => g !== genre))
    } else {
      onGenreChange([...selectedGenres, genre])
    }
  }

  const handleTagToggle = (tag: string) => {
    if (!onTagChange) return

    if (selectedTags.includes(tag)) {
      onTagChange(selectedTags.filter((t) => t !== tag))
    } else {
      onTagChange([...selectedTags, tag])
    }
  }

  const handleLanguageChange = (language: string) => {
    if (!onLanguageChange) return

    // If the same language is selected, clear it (toggle behavior)
    if (selectedLanguage === language) {
      onLanguageChange("")
    } else {
      onLanguageChange(language)
    }
  }

  const clearAllFilters = () => {
    onGenreChange([])
    if (onTagChange) onTagChange([])
    if (onLanguageChange) onLanguageChange("")
    if (onStatusChange) onStatusChange("all")
    onSortChange("newest")
  }

  return (
    <div className="bg-card rounded-lg border p-4 mb-6 md:mb-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Filters</h3>
        {(selectedGenres.length > 0 || selectedTags.length > 0 || selectedLanguage || storyStatus !== "all" || sortBy !== "newest") && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 text-xs">
            Clear all
          </Button>
        )}
      </div>

      {/* Selected filters */}
      {(selectedGenres.length > 0 || selectedTags.length > 0 || selectedLanguage || storyStatus !== "all") && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedGenres.map((genre) => (
            <Badge key={`genre-${genre}`} variant="secondary" className="flex items-center gap-1">
              {genre}
              <Button variant="ghost" size="icon" onClick={() => handleGenreToggle(genre)} className="h-4 w-4 p-0 ml-1">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {genre} filter</span>
              </Button>
            </Badge>
          ))}
          {selectedTags.map((tag) => (
            <Badge key={`tag-${tag}`} variant="outline" className="flex items-center gap-1 bg-primary/5">
              {tag}
              <Button variant="ghost" size="icon" onClick={() => handleTagToggle(tag)} className="h-4 w-4 p-0 ml-1">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag} filter</span>
              </Button>
            </Badge>
          ))}
          {selectedLanguage && (
            <Badge key={`language-${selectedLanguage}`} variant="outline" className="flex items-center gap-1 bg-blue-100/50 dark:bg-blue-900/20">
              {selectedLanguage}
              <Button variant="ghost" size="icon" onClick={() => onLanguageChange && onLanguageChange("")} className="h-4 w-4 p-0 ml-1">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove language filter</span>
              </Button>
            </Badge>
          )}
          {storyStatus !== "all" && (
            <Badge key={`status-${storyStatus}`} variant="outline" className="flex items-center gap-1 bg-green-100/50 dark:bg-green-900/20">
              {storyStatus === "ongoing" ? "Ongoing" : "Completed"}
              <Button variant="ghost" size="icon" onClick={() => onStatusChange && onStatusChange("all")} className="h-4 w-4 p-0 ml-1">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove status filter</span>
              </Button>
            </Badge>
          )}
        </div>
      )}

      <Accordion type="multiple" defaultValue={["sort", "status", "genres", "tags", "languages"]} className="w-full">
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

        {onStatusChange && (
          <AccordionItem value="status">
            <AccordionTrigger>Story Status</AccordionTrigger>
            <AccordionContent>
              <RadioGroup value={storyStatus} onValueChange={onStatusChange}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="status-all" />
                    <Label htmlFor="status-all" className="text-sm">
                      All Stories
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ongoing" id="status-ongoing" />
                    <Label htmlFor="status-ongoing" className="text-sm">
                      Ongoing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="completed" id="status-completed" />
                    <Label htmlFor="status-completed" className="text-sm">
                      Completed
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        )}

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

        {onTagChange && (
          <AccordionItem value="tags">
            <AccordionTrigger>Tags</AccordionTrigger>
            <AccordionContent>
              {loadingTags ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                  <span className="text-sm">Loading tags...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {tags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => handleTagToggle(tag)}
                      />
                      <Label htmlFor={`tag-${tag}`} className="text-sm">
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {onLanguageChange && (
          <AccordionItem value="languages">
            <AccordionTrigger>Language</AccordionTrigger>
            <AccordionContent>
              {loadingLanguages ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                  <span className="text-sm">Loading languages...</span>
                </div>
              ) : (
                <RadioGroup value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <RadioGroupItem value={language} id={`language-${language}`} />
                        <Label htmlFor={`language-${language}`} className="text-sm">
                          {language}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}

