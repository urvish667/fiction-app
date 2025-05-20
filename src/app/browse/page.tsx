"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import Navbar from "@/components/navbar"
import SearchBar from "@/components/search-bar"
import FilterPanel from "@/components/filter-panel"
import StoryGrid from "@/components/story-grid"
import AdBanner from "@/components/ad-banner"
import Pagination from "@/components/pagination"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Filter, Grid, List } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { StoryService } from "@/services/story-service"
import { useToast } from "@/components/ui/use-toast"

// Import UserSummary type
import { UserSummary } from "@/types/user"

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
  viewCount?: number // Combined story + chapter views
  readTime?: number
  date?: Date
  createdAt?: Date
  updatedAt?: Date
  slug?: string
  tags?: string[] // Array of tag names
}

// Component that uses searchParams
function BrowseContent() {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const [stories, setStories] = useState<BrowseStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>("") // Default to no language filter
  const [storyStatus, setStoryStatus] = useState<"all" | "ongoing" | "completed">("all") // Default to show all stories

  // Get URL parameters
  const searchParams = useSearchParams()
  const genreParam = searchParams ? searchParams.get("genre") : null

  // Function to update URL based on current filters
  const updateURL = useCallback(() => {
    // Create a URLSearchParams object to build the query string
    const params = new URLSearchParams()

    // Add genre filter to URL if present
    if (selectedGenres.length === 1) {
      params.set('genre', selectedGenres[0])
    }

    // Add other filters if needed in the future
    // if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    // if (selectedLanguage) params.set('language', selectedLanguage)
    // if (storyStatus !== 'all') params.set('status', storyStatus)
    // if (sortBy !== 'newest') params.set('sortBy', sortBy)

    // Create the new URL
    const queryString = params.toString()
    const newPath = pathname || '/browse'
    const newURL = queryString ? `${newPath}?${queryString}` : newPath

    // Update the URL without refreshing the page
    router.replace(newURL, { scroll: false })
  }, [pathname, router, selectedGenres])

  // Set initial genre filter from URL parameter and trigger data fetch
  useEffect(() => {
    const initializeFilters = async () => {
      if (genreParam) {
        // Decode the genre parameter (it might be URL-encoded)
        const decodedGenre = decodeURIComponent(genreParam)

        // Update the selected genres state
        setSelectedGenres([decodedGenre])
      }
    }

    initializeFilters()
  }, [genreParam])

  // Force a fetch when the component mounts with a genre parameter
  useEffect(() => {
    // Only run this effect once on mount if we have a genre parameter
    if (genreParam && selectedGenres.length > 0) {
      // The main fetch effect will handle the actual API call
    }
  }, [genreParam, selectedGenres])

  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStories, setTotalStories] = useState(0)
  const storiesPerPage = 16 // Show max 16 stories per page

  const isMobile = useMediaQuery("(max-width: 768px)")

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
      status: storyStatus, // Always send status parameter, API will handle 'all' correctly
      sortBy: sortBy // Include sort parameter
    }

    // Add search query if provided
    if (searchQuery) {
      params.search = searchQuery
    }

    // Add genre filter if selected
    // The API expects the genre name, not the ID
    if (selectedGenres.length > 0) {
      // If there's only one genre, use it directly
      if (selectedGenres.length === 1) {
        params.genre = selectedGenres[0]
      }
      // If there are multiple genres, we'll handle it client-side
      // (API currently doesn't support multiple genre filtering)
    }

    // Add tags filter if selected
    if (selectedTags.length > 0) {
      params.tags = selectedTags
    }

    // Add language filter if selected
    if (selectedLanguage) {
      params.language = selectedLanguage
    }

    return params
  }

  // Helper function to map API story to BrowseStory type
  const formatStory = (story: Record<string, any>): BrowseStory => {
    // Extract genre name from genre object if it exists
    let genreName = "General";
    if (story.genre) {
      if (typeof story.genre === 'object') {
        // Handle genre as an object with a name property
        if (story.genre.name) {
          genreName = story.genre.name;
        }
      } else if (typeof story.genre === 'string') {
        // Handle genre as a string directly
        genreName = story.genre;
      }
    }

    // Extract language name from language object if it exists
    let languageName = "";
    if (story.language) {
      if (typeof story.language === 'object') {
        // Handle language as an object with a name property
        if (story.language.name) {
          languageName = story.language.name;
        }
      } else if (typeof story.language === 'string') {
        // Handle language as a string directly
        languageName = story.language;
      }
    }

    // Extract tags if they exist
    let tags: string[] = [];
    if (story.tags) {
      // If tags is already an array of strings, use it directly
      if (Array.isArray(story.tags) && typeof story.tags[0] === 'string') {
        tags = story.tags;
      }
      // If tags is an array of objects with a tag property (from the API)
      else if (Array.isArray(story.tags) && story.tags.length > 0) {
        tags = story.tags.map((storyTag: Record<string, any>) => {
          // Handle different possible structures
          if (typeof storyTag === 'string') return storyTag;
          if (storyTag.tag && storyTag.tag.name) return storyTag.tag.name;
          if (storyTag.name) return storyTag.name;
          return '';
        }).filter(Boolean); // Remove empty strings
      }
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
      viewCount: story.viewCount || story.readCount || 0, // Prefer viewCount (combined), fall back to readCount
      readTime: Math.ceil(story.wordCount / 200), // Estimate read time based on word count
      date: story.createdAt ? new Date(story.createdAt) : new Date(),
      createdAt: story.createdAt ? new Date(story.createdAt) : new Date(),
      updatedAt: story.updatedAt ? new Date(story.updatedAt) : new Date(),
      slug: story.slug,
      tags: tags
    };
  }

  /**
   * Apply client-side filtering and sorting to stories
   * This is used when the API doesn't support certain filter combinations
   */
  const applyClientFilters = (stories: BrowseStory[]): BrowseStory[] => {
    // If no client-side filters are needed, return the original stories (but still apply sorting)
    let filteredStories = stories;

    // Apply filters if needed
    if (selectedGenres.length > 0 || selectedTags.length > 0 || searchQuery || selectedLanguage || storyStatus !== "all") {
      filteredStories = stories.filter(story => {
      // Apply genre filter if any genres are selected
      const matchesGenre = selectedGenres.length > 0
        ? selectedGenres.includes(story.genre || 'General')
        : true;

      // Apply tag filter if tags are selected
      let matchesTags = true;
      if (selectedTags.length > 0) {
        // Make sure story.tags exists and is an array
        if (!Array.isArray(story.tags) || story.tags.length === 0) {
          matchesTags = false;
        } else {
          // Check if any of the story's tags match any of the selected tags
          matchesTags = story.tags.some(tag =>
            selectedTags.some(selectedTag =>
              selectedTag.toLowerCase() === tag.toLowerCase()
            )
          );
        }
      }

      // Apply language filter if selected
      const matchesLanguage = !selectedLanguage ||
        (story.language &&
         (typeof story.language === 'string'
          ? story.language === selectedLanguage
          : (story.language as any).name === selectedLanguage));

      // Apply status filter if selected
      const matchesStatus = storyStatus === "all" ||
        (story.status === storyStatus);


      // Apply search filter if search query is provided
      // This is a fallback for client-side search if the API doesn't handle it
      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = (story.title || '').toLowerCase();
        const description = (story.description || '').toLowerCase();
        const authorName = typeof story.author === 'object'
          ? ((story.author?.name || story.author?.username || '').toLowerCase())
          : (story.author || '').toLowerCase();
        const genre = (story.genre || '').toLowerCase();
        const tags = Array.isArray(story.tags)
          ? story.tags.map(tag => tag.toLowerCase())
          : [];

        matchesSearch =
          title.includes(query) ||
          description.includes(query) ||
          authorName.includes(query) ||
          genre.includes(query) ||
          tags.some(tag => tag.includes(query));
      }

      return matchesGenre && matchesTags && matchesLanguage && matchesStatus && matchesSearch;
    });
    }

    // Apply client-side sorting
    return sortStories(filteredStories, sortBy);
  }

  /**
   * Sort stories based on the selected sort option
   * @param stories - Array of stories to sort
   * @param sortOption - Sort option (newest, popular, mostRead)
   * @returns Sorted array of stories
   */
  const sortStories = (stories: BrowseStory[], sortOption: string): BrowseStory[] => {
    const storiesCopy = [...stories]; // Create a copy to avoid mutating the original array

    switch (sortOption) {
      case 'newest':
        return storiesCopy.sort((a, b) => {
          const dateA = a.createdAt || new Date();
          const dateB = b.createdAt || new Date();
          return dateB.getTime() - dateA.getTime();
        });
      case 'popular':
        return storiesCopy.sort((a, b) => {
          // Always use likeCount as the primary field
          const likesA = a.likeCount || 0;
          const likesB = b.likeCount || 0;
          return likesB - likesA;
        });
      case 'mostRead':
        return storiesCopy.sort((a, b) => {
          // Always use viewCount as the primary field
          const viewsA = a.viewCount || 0;
          const viewsB = b.viewCount || 0;
          return viewsB - viewsA;
        });
      default:
        return storiesCopy;
    }
  }

  // Fetch stories from the API
  useEffect(() => {
    // Skip the initial fetch if we have a genre parameter from the URL
    // We'll fetch after setting the selectedGenres state
    if (genreParam && selectedGenres.length === 0) {
      return;
    }

    const fetchStories = async () => {
      setLoading(true)
      setError(null)

      try {
        // Prepare API parameters
        const params = formatApiParams()

        // Fetch stories from the API
        const response = await StoryService.getStories(params)

        // Map API response to BrowseStory type
        const formattedStories = response.stories.map(formatStory);

        // Apply any client-side filtering if needed
        const filteredStories = applyClientFilters(formattedStories);



        setStories(filteredStories)

        // If we're doing client-side filtering, adjust the total counts
        if (selectedGenres.length > 0 || selectedTags.length > 0) {
          setTotalStories(filteredStories.length)
          setTotalPages(Math.ceil(filteredStories.length / storiesPerPage))
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

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when search changes
  }

  // Handle genre selection
  const handleGenreChange = (genres: string[]) => {
    setSelectedGenres(genres)
    setCurrentPage(1) // Reset to first page when filters change

    // Update URL when genre filter changes
    setTimeout(() => updateURL(), 0) // Use setTimeout to ensure state is updated first
  }

  // Handle tag selection
  const handleTagChange = (tags: string[]) => {
    setSelectedTags(tags)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle language selection
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle status selection
  const handleStatusChange = (status: "all" | "ongoing" | "completed") => {
    setStoryStatus(status)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle sort selection
  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setCurrentPage(1) // Reset to first page when sort changes
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div className="w-full">
            <h1 className="text-3xl font-bold mb-6">Browse Stories</h1>

            <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
              <SearchBar onSearch={handleSearch} className="w-full sm:w-96" />

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-primary/10" : ""}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-primary/10" : ""}
                >
                  <List className="h-4 w-4" />
                </Button>

                {isMobile && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    className={showFilters ? "bg-primary/10" : ""}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Filter Panel - Hidden on mobile unless toggled */}
              <AnimatePresence>
                {(!isMobile || showFilters) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full md:w-64 md:sticky md:top-20"
                  >
                    <FilterPanel
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content */}
              <div className="flex-1">


                {/* Loading state or error state */}
                {loading ? (
                  <StoryGrid stories={[]} viewMode={viewMode} isLoading={true} />
                ) : error ? (
                  <div className="text-center py-16">
                    <h3 className="text-xl font-semibold mb-2">Error loading stories</h3>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedGenres([])
                        setSelectedTags([])
                        setSelectedLanguage("")
                        setStoryStatus("all")
                        setSortBy("newest")
                        setCurrentPage(1)

                        // Update URL to remove all parameters
                        setTimeout(() => {
                          router.replace(pathname || '/browse', { scroll: false })
                        }, 0)
                      }}
                    >
                      Try again
                    </Button>
                  </div>
                ) : stories.length > 0 ? (
                  <>
                    {/* Results count and info */}
                    <div className="mb-4 text-sm text-muted-foreground">
                      {totalStories} {totalStories === 1 ? "story" : "stories"} found
                      {searchQuery && (
                        <span> matching &quot;{searchQuery}&quot;</span>
                      )}
                      {selectedGenres.length > 0 && (
                        <span> in {selectedGenres.join(", ")}</span>
                      )}
                      {selectedTags.length > 0 && (
                        <span> with tags {selectedTags.join(", ")}</span>
                      )}
                      {selectedLanguage && (
                        <span> in {selectedLanguage}</span>
                      )}
                      {storyStatus !== "all" && (
                        <span> with status {storyStatus}</span>
                      )}
                      {sortBy !== "newest" && (
                        <span> sorted by {sortBy === "popular" ? "most liked" : sortBy === "mostRead" ? "most read" : sortBy}</span>
                      )}
                      {searchQuery && (
                        <div className="mt-1 text-xs">
                          <em>Search includes story titles, descriptions, author names, genres, and tags</em>
                        </div>
                      )}
                    </div>

                    {/* Story Grid with Ads */}
                    <StoryGrid stories={stories} viewMode={viewMode} showAds={true} isLoading={false} />

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <h3 className="text-xl font-semibold mb-2">No stories found</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedGenres([])
                        setSelectedTags([])
                        setSelectedLanguage("")
                        setStoryStatus("all")
                        setSortBy("newest")

                        // Update URL to remove all parameters
                        setTimeout(() => {
                          router.replace(pathname || '/browse', { scroll: false })
                        }, 0)
                      }}
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Banner Ad */}
      <div className="sticky bottom-0 w-full z-40">
        <AdBanner type="banner" className="w-full h-16" />
      </div>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}

// Main component that wraps the BrowseContent in a Suspense boundary
export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-8 py-8">
          <h1 className="text-3xl font-bold mb-6">Browse Stories</h1>
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">Loading stories...</h3>
          </div>
        </main>
        <SiteFooter />
      </div>
    }>
      <BrowseContent />
    </Suspense>
  )
}

