"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import HorizontalFilterBar from "@/components/horizontal-filter-bar"
import StoryGrid from "@/components/story-grid"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import Pagination from "@/components/pagination"
import CategoryDescription from "@/components/category-description"
import { Button } from "@/components/ui/button"
import { Grid, List } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { StoryService } from "@/services/story-service"
import { useToast } from "@/hooks/use-toast"
import { UserSummary } from "@/types/user"
import { safeDecodeURIComponent } from "@/utils/safe-decode-uri-component"
import AdBanner from "@/components/ad-banner"
import { BrowseResult } from "@/lib/server/browse-data"

// Define a type for stories in the browse page
type BrowseStory = {
  id: string | number
  title: string
  author: string | UserSummary
  genre?: string
  language?: string
  status?: string
  coverImage?: string
  excerpt?: string
  description?: string
  likeCount?: number
  commentCount?: number
  viewCount?: number
  readTime?: number
  date?: Date
  createdAt?: Date
  updatedAt?: Date
  slug?: string
  tags?: string[]
  isMature?: boolean
}

// Tag type
interface TagOption {
  id: string;
  name: string;
  slug: string;
}

// Genre option type
interface GenreOption {
  id: string;
  name: string;
  slug: string;
}

interface BrowseContentProps {
  initialParams: {
    genre?: string
    tag?: string
    tags?: string
    search?: string
    page?: string
    sortBy?: string
    status?: string
    language?: string
  }
  initialData: BrowseResult
}

export default function BrowseContent({ initialParams, initialData }: BrowseContentProps) {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  
  // Transform server-side data to client format
  const transformServerStory = useCallback((story: BrowseResult['stories'][0]): BrowseStory => {
    return {
      id: story.id,
      title: story.title,
      author: story.author.username || story.author.name || "Unknown Author",
      genre: story.genre?.name || "General",
      language: story.language?.name || "",
      status: story.status || "ongoing",
      coverImage: (story.coverImage && story.coverImage.trim() !== "") ? story.coverImage : "/placeholder.svg",
      excerpt: story.description || undefined,
      description: story.description || undefined,
      likeCount: story.likeCount || 0,
      commentCount: story.commentCount || 0,
      viewCount: story.viewCount || 0,
      readTime: Math.ceil((story.wordCount || 0) / 200),
      date: story.createdAt,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      slug: story.slug,
      tags: story.tags.map(t => t.tag.name),
      isMature: story.isMature || false
    };
  }, []);

  // Initialize with server-side data
  const [stories, setStories] = useState<BrowseStory[]>(
    initialData.stories.map(transformServerStory)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialParams.search || "")
  const [allGenres, setAllGenres] = useState<GenreOption[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [allTags, setAllTags] = useState<TagOption[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialParams.language || "")
  const [storyStatus, setStoryStatus] = useState<"all" | "ongoing" | "completed">(
    (initialParams.status as "all" | "ongoing" | "completed") || "all"
  )
  const [sortBy, setSortBy] = useState(initialParams.sortBy || "newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(parseInt(initialParams.page || "1"))
  const [totalPages, setTotalPages] = useState(initialData.pagination.totalPages)
  const [totalStories, setTotalStories] = useState(initialData.pagination.total)
  const storiesPerPage = 16

  const isMobile = useMediaQuery("(max-width: 1024px)")

  // Fetch all genres and tags on mount
  useEffect(() => {
    async function fetchGenres() {
      try {
        const response = await fetch('/api/genres')
        if (response.ok) {
          const data = await response.json()
          setAllGenres(data)
        }
      } catch {
        // fallback: do nothing
      }
    }

    async function fetchTags() {
      try {
        const response = await fetch('/api/tags')
        if (response.ok) {
          const data = await response.json()
          setAllTags(data)
        }
      } catch {
        // fallback: do nothing
      }
    }
    fetchGenres()
    fetchTags()
  }, [])

  // Initialize selectedGenres from URL params
  useEffect(() => {
    if (initialParams.genre && allGenres.length > 0) {
      const genreSlug = safeDecodeURIComponent(initialParams.genre)
      if (genreSlug) {
        const found = allGenres.find(g => g.slug === genreSlug)
        if (found) {
          setSelectedGenres([found.slug])
        }
      }
    }
  }, [initialParams.genre, allGenres])

  // Initialize selectedTags from tag/tags params, using slug-to-name mapping
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (initialParams.tag && allTags.length > 0) {
      const decodedTag = safeDecodeURIComponent(initialParams.tag!)
      if (decodedTag) {
        const found = allTags.find(t => t.slug === decodedTag)
        return found ? [found.name] : []
      }
    } else if (initialParams.tags) {
      return initialParams.tags.split(',').map(t => safeDecodeURIComponent(t.trim())).filter((t): t is string => t !== null)
    }
    return []
  })

  // When allTags or initialParams.tag changes, update selectedTags if needed
  useEffect(() => {
    if (initialParams.tag && allTags.length > 0) {
      const decodedTag = safeDecodeURIComponent(initialParams.tag!)
      if (decodedTag) {
        const found = allTags.find(t => t.slug === decodedTag)
        if (found && (!selectedTags.length || selectedTags[0] !== found.name)) {
          setSelectedTags([found.name])
        }
      }
    }
  }, [initialParams.tag, allTags])

  // Function to update URL based on current filters
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()

    if (selectedGenres.length === 1) {
      const genre = allGenres.find(g => g.slug === selectedGenres[0])
      if (genre) {
        params.set('genre', genre.slug)
      }
    }
    if (searchQuery) {
      params.set('search', searchQuery)
    }
    if (currentPage > 1) {
      params.set('page', currentPage.toString())
    }
    if (sortBy !== 'newest') {
      params.set('sortBy', sortBy)
    }
    if (storyStatus !== 'all') {
      params.set('status', storyStatus)
    }
    if (selectedLanguage) {
      params.set('language', selectedLanguage)
    }
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','))
    }

    const queryString = params.toString()
    const newPath = pathname || '/browse'
    const newURL = queryString ? `${newPath}?${queryString}` : newPath

    router.replace(newURL, { scroll: false })
  }, [pathname, router, selectedGenres, selectedTags, searchQuery, currentPage, sortBy, storyStatus, selectedLanguage, allGenres])

  // Helper function to format API parameters
  const formatApiParams = () => {
    const params: {
      page: number;
      limit: number;
      genre?: string;
      search?: string;
      status?: string;
      tags?: string[];
      sortBy?: string;
      language?: string;
    } = {
      page: currentPage,
      limit: storiesPerPage,
      status: storyStatus,
      sortBy: sortBy
    }

    if (searchQuery) {
      params.search = searchQuery
    }

    if (selectedGenres.length > 0) {
      if (selectedGenres.length === 1) {
        // Find the genre name from the slug
        const genre = allGenres.find(g => g.slug === selectedGenres[0])
        if (genre) {
          params.genre = genre.name
        }
      }
    }

    if (selectedTags.length > 0) {
      params.tags = selectedTags
    }

    if (selectedLanguage) {
      params.language = selectedLanguage
    }

    return params
  }

  // Helper function to map API story to BrowseStory type
  const formatStory = useCallback((story: Record<string, any>): BrowseStory => {
    let genreName = "General";
    if (story.genre) {
      if (typeof story.genre === 'object') {
        if (story.genre.name) {
          genreName = story.genre.name;
        }
      } else if (typeof story.genre === 'string') {
        genreName = story.genre;
      }
    }

    let languageName = "";
    if (story.language) {
      if (typeof story.language === 'object') {
        if (story.language.name) {
          languageName = story.language.name;
        }
      } else if (typeof story.language === 'string') {
        languageName = story.language;
      }
    }

    let tags: string[] = [];
    if (story.tags && Array.isArray(story.tags)) {
      tags = story.tags.map((tag: any) => {
        if (tag && typeof tag === 'object' && tag.name) {
          return tag.name;
        }
        if (typeof tag === 'string') {
          return tag;
        }
        if (tag && tag.tag && tag.tag.name) {
          return tag.tag.name;
        }
        return '';
      }).filter(Boolean);
    }

    return {
      id: story.id,
      title: story.title,
      author: story.author || "Unknown Author",
      genre: genreName,
      language: languageName,
      status: story.status || "ongoing",
      coverImage: (story.coverImage && story.coverImage.trim() !== "") ? story.coverImage : "/placeholder.svg",
      excerpt: story.description,
      description: story.description,
      likeCount: story.likeCount || 0,
      commentCount: story.commentCount || 0,
      viewCount: story.viewCount || story.readCount || 0,
      readTime: Math.ceil(story.wordCount / 200),
      date: story.createdAt ? new Date(story.createdAt) : new Date(),
      createdAt: story.createdAt ? new Date(story.createdAt) : new Date(),
      updatedAt: story.updatedAt ? new Date(story.updatedAt) : new Date(),
      slug: story.slug,
      tags: tags,
      isMature: story.isMature || false
    };
  }, [])

  // Fetch stories from the API
  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = formatApiParams()
        const response = await StoryService.getStories(params)
        const formattedStories = response.stories.map(story => formatStory(story));

        setStories(formattedStories)

        if (selectedGenres.length > 0 || selectedTags.length > 0) {
          setTotalStories(response.pagination.total)
          setTotalPages(response.pagination.totalPages)
        } else {
          setTotalPages(response.pagination.totalPages)
          setTotalStories(response.pagination.total)
        }
      } catch (err) {
        setError("Failed to load stories. Please try again later.")
        toast({
          title: "Error",
          description: "Failed to load stories. Please try again later.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [currentPage, searchQuery, selectedGenres, selectedTags, selectedLanguage, storyStatus, sortBy, toast])

  // Update URL when filters change
  useEffect(() => {
    updateURL()
  }, [updateURL])


  // Handle genre selection
  const handleGenreChange = (genres: string[]) => {
    setSelectedGenres(genres)
    setCurrentPage(1)
  }

  // Handle tag selection
  const handleTagChange = (tags: string[]) => {
    setSelectedTags(tags)
    setCurrentPage(1)
  }

  // Handle language selection
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    setCurrentPage(1)
  }

  // Handle status selection
  const handleStatusChange = (status: "all" | "ongoing" | "completed") => {
    setStoryStatus(status)
    setCurrentPage(1)
  }

  // Handle sort selection
  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setCurrentPage(1)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <main className="flex-1 w-full py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Browse Stories</h1>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-primary/10" : ""}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-primary/10" : ""}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category Description for genre pages */}
          {selectedGenres.length === 1 && (
            <CategoryDescription
              genre={allGenres.find(g => g.slug === selectedGenres[0])?.name || selectedGenres[0]}
              totalStories={totalStories}
              language={selectedLanguage}
              status={storyStatus}
            />
          )}

          {/* Horizontal Filter Bar */}
          <HorizontalFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedGenres={selectedGenres}
            onGenreChange={handleGenreChange}
            selectedTags={selectedTags}
            onTagChange={handleTagChange}
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
            storyStatus={storyStatus}
            onStatusChange={handleStatusChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Stories Grid */}
        <div className="w-full">
          {loading ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground">Loading stories...</p>
              </div>
              <div className={`grid gap-6 ${
                viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              }`}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <StoryCardSkeleton viewMode={viewMode} />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2 text-destructive">Error</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground">
                  {totalStories} {totalStories === 1 ? 'story' : 'stories'} found
                </p>
              </div>

              <StoryGrid stories={stories} viewMode={viewMode} />

              <div className="w-full py-4">
                <AdBanner
                  type="banner"
                  className="w-full max-w-[720px] h-[90px] mx-auto"
                  slot="6596765108"
                />
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
