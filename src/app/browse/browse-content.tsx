"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import HorizontalFilterBar from "@/components/horizontal-filter-bar"
import StoryGrid from "@/components/story-grid"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import CategoryDescription from "@/components/category-description"
import { StoryService } from "@/lib/api/story"
import { MetaService } from "@/lib/api/meta"
import { ImageService } from "@/lib/api/images"
import { useToast } from "@/hooks/use-toast"
import { safeDecodeURIComponent } from "@/utils/safe-decode-uri-component"
import AdBanner from "@/components/ad-banner"
import { BrowseResult } from "@/lib/server/browse-data"
import type { StoryCardData } from "@/components/story-card"

// ─── Types ─────────────────────────────────────────────────────────────────

type BrowseStory = StoryCardData & {
  language?: string
  status?: string
}

interface TagOption { id: string; name: string; slug: string }
interface GenreOption { id: string; name: string; slug: string }

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

// ─── Story transformer ────────────────────────────────────────────────────────

function useStoryTransformer() {
  const transformServerStory = useCallback((story: BrowseResult["stories"][0]): BrowseStory => ({
    id: story.id,
    title: story.title,
    author: story.author.username || story.author.name || "Unknown Author",
    genre: story.genre?.name || "General",
    language: story.language?.name || "",
    status: story.status || "ongoing",
    coverImage: story.coverImage
      ? ImageService.getImageUrl(story.coverImage) || "/placeholder.svg"
      : "/placeholder.svg",
    excerpt: story.description || undefined,
    description: story.description || undefined,
    likeCount: story.likeCount || 0,
    commentCount: story.commentCount || 0,
    viewCount: story.viewCount || 0,
    chapterCount: story.chapterCount ?? (story as any)._count?.chapters ?? undefined,
    readTime: Math.ceil((story.wordCount || 0) / 200),
    date: story.createdAt ? new Date(story.createdAt) : undefined,
    createdAt: story.createdAt ? new Date(story.createdAt) : undefined,
    updatedAt: story.updatedAt ? new Date(story.createdAt) : undefined,
    slug: story.slug || undefined,
    tags: story.tags.map((t) => t.tag.name),
    isMature: story.isMature || false,
    isBookmarked: false,
  }), [])

  const formatApiStory = useCallback((story: Record<string, any>): BrowseStory => {
    const genreName = typeof story.genre === "object" ? story.genre?.name : (story.genre || "General")
    const languageName = typeof story.language === "object" ? story.language?.name : (story.language || "")
    const tags = Array.isArray(story.tags)
      ? story.tags.map((t: any) => t?.name || t?.tag?.name || (typeof t === "string" ? t : "")).filter(Boolean)
      : []

    return {
      id: story.id,
      title: story.title,
      author: story.author || "Unknown Author",
      genre: genreName,
      language: languageName,
      status: story.status || "ongoing",
      coverImage: story.coverImage
        ? ImageService.getImageUrl(story.coverImage) || "/placeholder.svg"
        : "/placeholder.svg",
      excerpt: story.description,
      description: story.description,
      likeCount: story.likeCount || 0,
      commentCount: story.commentCount || 0,
      viewCount: story.viewCount || story.readCount || 0,
      chapterCount: story.chapterCount ?? story._count?.chapters ?? undefined,
      readTime: Math.ceil((story.wordCount || 0) / 200),
      date: story.createdAt ? new Date(story.createdAt) : new Date(),
      createdAt: story.createdAt ? new Date(story.createdAt) : new Date(),
      updatedAt: story.updatedAt ? new Date(story.updatedAt) : new Date(),
      slug: story.slug,
      tags,
      isMature: story.isMature || false,
      isBookmarked: false,
    }
  }, [])

  return { transformServerStory, formatApiStory }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BrowseContent({ initialParams, initialData }: BrowseContentProps) {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const { transformServerStory, formatApiStory } = useStoryTransformer()

  // ── State ──────────────────────────────────────────────────────────────────
  const [stories, setStories] = useState<BrowseStory[]>(
    initialData.stories.map(transformServerStory)
  )
  const [loading, setLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialParams.search || "")
  const [allGenres, setAllGenres] = useState<GenreOption[]>([])
  // Initialize directly from URL slug — no API needed, it's just a string
  const [selectedGenres, setSelectedGenres] = useState<string[]>(() => {
    const slug = initialParams.genre ? safeDecodeURIComponent(initialParams.genre) : null
    return slug ? [slug] : []
  })
  const [allTags, setAllTags] = useState<TagOption[]>([])
  // Handle both ?tags=a,b and single ?tag=x URL params at init time
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (initialParams.tags) {
      return initialParams.tags.split(",").map((t) => safeDecodeURIComponent(t.trim())).filter((t): t is string => t !== null)
    }
    if (initialParams.tag) {
      const decoded = safeDecodeURIComponent(initialParams.tag)
      return decoded ? [decoded] : []
    }
    return []
  })
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialParams.language || "")
  const [storyStatus, setStoryStatus] = useState<"all" | "ongoing" | "completed">(
    (initialParams.status as "all" | "ongoing" | "completed") || "all"
  )
  const [sortBy, setSortBy] = useState(initialParams.sortBy || "newest")
  const [currentPage, setCurrentPage] = useState(parseInt(initialParams.page || "1"))
  const [totalPages, setTotalPages] = useState(initialData.pagination.totalPages)
  const [totalStories, setTotalStories] = useState(initialData.pagination.total)
  const [initialFetchDone, setInitialFetchDone] = useState(false)

  const observerTargetRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const storiesPerPage = 16
  const hasMore = currentPage < totalPages

  // ── Fetch genres & tags (single source of truth) ─────────────────────────
  useEffect(() => {
    MetaService.getGenres().then((r) => r.success && r.data && setAllGenres(r.data)).catch(() => {})
    MetaService.getTags().then((r) => r.success && r.data && setAllTags(r.data)).catch(() => {})
  }, [])

  // ── Sync tag name from slug (only needed when ?tag= is used, after tags load) ─
  // selectedTags is pre-initialized with the raw slug; once tags load we refine to the display name
  useEffect(() => {
    if (initialParams.tag && allTags.length > 0 && selectedTags.length === 1) {
      const found = allTags.find((t) => t.slug === selectedTags[0])
      if (found && found.name !== selectedTags[0]) {
        setSelectedTags([found.name])
      }
    }
  }, [allTags]) // only runs once when tags first load

  // ── URL sync ──────────────────────────────────────────────────────────────
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()
    if (selectedGenres.length === 1) {
      const genre = allGenres.find((g) => g.slug === selectedGenres[0])
      if (genre) params.set("genre", genre.slug)
    }
    if (searchQuery) params.set("search", searchQuery)
    if (currentPage > 1) params.set("page", currentPage.toString())
    if (sortBy !== "newest") params.set("sortBy", sortBy)
    if (storyStatus !== "all") params.set("status", storyStatus)
    if (selectedLanguage) params.set("language", selectedLanguage)
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","))

    const qs = params.toString()
    const base = pathname || "/browse"
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false })
  }, [pathname, router, selectedGenres, selectedTags, searchQuery, currentPage, sortBy, storyStatus, selectedLanguage, allGenres])

  useEffect(() => { updateURL() }, [updateURL])

  // ── Fetch stories (Page 1 replacement vs Append) ─────────────────────────
  const fetchStories = useCallback(async (pageToFetch: number, isReset: boolean = false) => {
    if (isReset) {
      // Cancel any in-flight request before starting a new one
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()
      setLoading(true)
    } else {
      setIsFetchingMore(true)
    }
    setError(null)

    try {
      const params: Record<string, any> = {
        page: pageToFetch,
        limit: storiesPerPage,
        status: storyStatus,
        sortBy,
      }
      if (searchQuery) params.search = searchQuery
      if (selectedGenres.length === 1) {
        const genre = allGenres.find((g) => g.slug === selectedGenres[0])
        if (genre) params.genre = genre.name
      }
      if (selectedTags.length > 0) params.tags = selectedTags
      if (selectedLanguage) params.language = selectedLanguage

      const response = await StoryService.getStories(params)
      if (response.success && response.data) {
        const fetchedStories = response.data.stories.map((s: any) => formatApiStory(s))
        if (isReset) {
          setStories(fetchedStories)
        } else {
          setStories((prev) => {
            const existingIds = new Set(prev.map((s) => s.id))
            const newUnique = fetchedStories.filter((s: BrowseStory) => !existingIds.has(s.id))
            return [...prev, ...newUnique]
          })
        }
        setCurrentPage(pageToFetch)
        setTotalPages(response.data.pagination.totalPages)
        setTotalStories(response.data.pagination.total)
      } else {
        throw new Error(response.message || "Failed to fetch stories")
      }
    } catch {
      setError("Failed to load stories. Please try again later.")
      toast({ title: "Error", description: "Failed to load stories.", variant: "destructive" })
    } finally {
      setLoading(false)
      setIsFetchingMore(false)
    }
  }, [storyStatus, sortBy, searchQuery, selectedGenres, allGenres, selectedTags, selectedLanguage, storiesPerPage, formatApiStory, toast])

  // ── Filter change effect (debounced to batch rapid changes) ─────────────
  useEffect(() => {
    const isInitialMatch =
      selectedGenres.length === (initialParams.genre ? 1 : 0) &&
      currentPage === parseInt(initialParams.page || "1") &&
      searchQuery === (initialParams.search || "") &&
      selectedLanguage === (initialParams.language || "") &&
      storyStatus === ((initialParams.status as any) || "all") &&
      sortBy === (initialParams.sortBy || "newest") &&
      selectedTags.length === (initialParams.tag || initialParams.tags ? selectedTags.length : 0)

    if (!initialFetchDone && isInitialMatch) {
      setInitialFetchDone(true)
      return
    }

    const timer = setTimeout(() => fetchStories(1, true), 400)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedGenres, selectedTags, selectedLanguage, storyStatus, sortBy])

  // ── Intersection Observer for Auto-Fetching (Infinite Scroll) ─────────────
  const fetchNextPage = useCallback(() => {
    if (loading || isFetchingMore || !hasMore) return
    fetchStories(currentPage + 1, false)
  }, [loading, isFetchingMore, hasMore, currentPage, fetchStories])

  useEffect(() => {
    const target = observerTargetRef.current
    if (!target || !hasMore || loading || isFetchingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1, rootMargin: "250px" }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, loading, isFetchingMore, fetchNextPage])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGenreChange = (genres: string[]) => { setSelectedGenres(genres) }
  const handleTagChange = (tags: string[]) => { setSelectedTags(tags) }
  const handleLanguageChange = (language: string) => { setSelectedLanguage(language) }
  const handleStatusChange = (status: "all" | "ongoing" | "completed") => { setStoryStatus(status) }
  const handleSortChange = (sort: string) => { setSortBy(sort) }

  const handleBookmark = useCallback((id: string | number) => {
    setStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isBookmarked: !s.isBookmarked } : s))
    )
  }, [])

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex justify-between items-center gap-4 mb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold">Browse Stories</h1>
      </div>

      {/* ── Genre category description ────────────────────────────────── */}
      {selectedGenres.length === 1 && (
        <CategoryDescription
          genre={allGenres.find((g) => g.slug === selectedGenres[0])?.name || selectedGenres[0]}
          totalStories={totalStories}
          language={selectedLanguage}
          status={storyStatus}
        />
      )}

      {/* ── Full-width filter bar ─────────────────────────────────────── */}
      <div className="mb-6">
        <HorizontalFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedGenres={selectedGenres}
          onGenreChange={handleGenreChange}
          selectedTags={selectedTags}
          onTagChange={handleTagChange}
          availableTags={allTags}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          storyStatus={storyStatus}
          onStatusChange={handleStatusChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />
      </div>

      {/* ── Three-column layout: stories + sidebar ────────────────────── */}
      <div className="flex gap-6">

        {/* Main content area */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div>
              <div className="text-sm text-muted-foreground mb-4">Loading stories...</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <StoryCardSkeleton
                    key={`skeleton-${i}`}
                    variant="landscape-list"
                  />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-lg font-semibold text-destructive mb-2">Something went wrong</p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Story count */}
                <p className="text-sm text-muted-foreground mb-4">
                  {totalStories.toLocaleString()} {totalStories === 1 ? "story" : "stories"} found
                </p>

                {/* Story grid */}
                <StoryGrid
                  stories={stories}
                  viewMode="grid"
                  onBookmark={handleBookmark}
                />

                {/* Infinite Scroll Sentinel & Auto-fetching loader */}
                <div ref={observerTargetRef} className="my-8 flex flex-col items-center justify-center min-h-[60px]">
                  {isFetchingMore && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground animate-pulse">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading more stories...</span>
                    </div>
                  )}
                  {!hasMore && stories.length > 0 && !loading && (
                    <p className="text-xs text-muted-foreground opacity-70">
                      You've reached the end of stories.
                    </p>
                  )}
                </div>

              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* ── Right sticky sidebar ad (hidden on mobile/tablet) ─────── */}
        <aside className="hidden xl:block w-[300px] shrink-0">
          <div className="sticky top-24 flex flex-col gap-6">
            {/* Primary sidebar ad */}
            <AdBanner
              type="sidebar"
              className="w-[300px] min-h-[250px]"
              slot="6596765108"
            />

            {/* Optional: second ad unit lower in sidebar */}
            <div className="mt-4">
              <AdBanner
                type="sidebar"
                className="w-[300px] min-h-[250px]"
                slot="6596765108"
              />
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}

