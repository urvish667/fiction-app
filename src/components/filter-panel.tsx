"use client"
import { useState, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Loader2 } from "lucide-react"
import { logError } from "@/lib/error-logger"

// Genre option type
interface GenreOption {
  id: string;
  name: string;
  slug: string;
}

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

// Tag type
interface TagOption {
  id: string;
  name: string;
  slug: string;
}

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
  tags?: TagOption[]
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
  const [genres, setGenres] = useState<GenreOption[]>([])
  const [tags, setTags] = useState<TagOption[]>([])
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
          // Ensure each genre has a slug, create one if missing
          const genresWithSlugs = data.map((genre: any) => ({
            ...genre,
            slug: genre.slug || genre.name.toLowerCase().replace(/\s+/g, '-')
          }))
          setGenres(genresWithSlugs)
        } else {
          // Fall back to default genres with generated slugs for functionality
          setGenres(defaultGenres.map((name, i) => ({
            id: String(i),
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-')
          })))
        }
      } catch (error) {
        logError(error, { context: 'Fetching genres' });
        // Fall back to default genres with generated slugs for functionality
        setGenres(defaultGenres.map((name, i) => ({
          id: String(i),
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-')
        })))
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
          // Store tags as {id, name, slug}
          setTags(data)
        } else {
          // Fall back to default tags with generated slugs for functionality
          setTags(defaultTags.map((name, i) => ({
            id: String(i),
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-')
          })))
        }
      } catch (error) {
        logError(error, { context: 'Fetching tags' })
        // Fall back to default tags with generated slugs for functionality
        setTags(defaultTags.map((name, i) => ({
          id: String(i),
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-')
        })))
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
        logError(error, { context: 'Fetching languages' })
        // Fall back to default languages if API fails
        setLanguages(defaultLanguages)
      } finally {
        setLoadingLanguages(false)
      }
    }

    fetchLanguages()
  }, [])

  const handleGenreToggle = (genreSlug: string) => {
    if (selectedGenres.includes(genreSlug)) {
      onGenreChange(selectedGenres.filter((slug) => slug !== genreSlug))
    } else {
      onGenreChange([...selectedGenres, genreSlug])
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
          {/* Show only first 3 genres and a "+X more" badge if there are more */}
          {selectedGenres.slice(0, 3).map((slug) => {
            const genre = genres.find((g) => g.slug === slug)
            if (!genre) return null
            return (
              <Badge key={`genre-${slug}`} variant="secondary" className="flex items-center gap-1 max-w-[150px]">
                <span className="truncate">{genre.name}</span>
                <Button variant="ghost" size="icon" onClick={() => handleGenreToggle(slug)} className="h-4 w-4 p-0 ml-1 shrink-0">
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {genre.name} filter</span>
                </Button>
              </Badge>
            )
          })}
          {selectedGenres.length > 3 && (
            <Badge variant="secondary">
              +{selectedGenres.length - 3} more
            </Badge>
          )}
          {/* Show only first 3 tags and a "+X more" badge if there are more */}
          {selectedTags.slice(0, 3).map((tag) => (
            <Badge key={`tag-${tag}`} variant="outline" className="flex items-center gap-1 bg-primary/5 max-w-[150px]">
              <span className="truncate">{tag}</span>
              <Button variant="ghost" size="icon" onClick={() => handleTagToggle(tag)} className="h-4 w-4 p-0 ml-1 shrink-0">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag} filter</span>
              </Button>
            </Badge>
          ))}
          {selectedTags.length > 3 && (
            <Badge variant="outline" className="bg-primary/5">
              +{selectedTags.length - 3} more
            </Badge>
          )}
          {selectedLanguage && (
            <Badge key={`language-${selectedLanguage}`} variant="outline" className="flex items-center gap-1 bg-blue-100/50 dark:bg-blue-900/20 max-w-[150px]">
              <span className="truncate">{selectedLanguage}</span>
              <Button variant="ghost" size="icon" onClick={() => onLanguageChange && onLanguageChange("")} className="h-4 w-4 p-0 ml-1 shrink-0">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove language filter</span>
              </Button>
            </Badge>
          )}
          {storyStatus !== "all" && (
            <Badge key={`status-${storyStatus}`} variant="outline" className="flex items-center gap-1 bg-green-100/50 dark:bg-green-900/20 max-w-[150px]">
              <span className="truncate">{storyStatus === "ongoing" ? "Ongoing" : "Completed"}</span>
              <Button variant="ghost" size="icon" onClick={() => onStatusChange && onStatusChange("all")} className="h-4 w-4 p-0 ml-1 shrink-0">
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
                  <div key={genre.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`genre-${genre.slug}`}
                      checked={selectedGenres.includes(genre.slug)}
                      onCheckedChange={() => handleGenreToggle(genre.slug)}
                    />
                    <Label htmlFor={`genre-${genre.slug}`} className="text-sm">
                      {genre.name}
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
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.name}`}
                          checked={selectedTags.includes(tag.name)}
                          onCheckedChange={() => handleTagToggle(tag.name)}
                        />
                        <Label htmlFor={`tag-${tag.name}`} className="text-sm truncate max-w-[100px]" title={tag.name}>
                          {tag.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {tags.length > 20 && (
                    <div className="mt-2 text-center text-xs text-muted-foreground">
                      Showing 20 of {tags.length} tags
                    </div>
                  )}
                </>
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
