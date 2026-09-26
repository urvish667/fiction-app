"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { StoryService } from "@/lib/api/story"
import { MetaService } from "@/lib/api/meta"
import { ImageService } from "@/lib/api/images"
import { safeDecodeURIComponent } from "@/utils/safe-decode-uri-component"
import { getGenreName } from "@/features/story"
import type { BrowseParams, BrowseStory, GenreOption, TagOption } from "../types/browse.types"
import type { BrowseResult } from "@/lib/server/browse-data"

const STORIES_PER_PAGE = 16

// ── Module-Level Singletons for Genres & Tags ─────────────────────────────
let cachedGenres: GenreOption[] | null = null
let cachedTags: TagOption[] | null = null
let genresInFlight: Promise<GenreOption[]> | null = null
let tagsInFlight: Promise<TagOption[]> | null = null

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
let cachedGenresTime = 0
let cachedTagsTime = 0

async function getCachedGenres(): Promise<GenreOption[]> {
  const now = Date.now()
  if (cachedGenres && now - cachedGenresTime < CACHE_TTL_MS) return cachedGenres
  if (genresInFlight) return genresInFlight

  genresInFlight = MetaService.getGenres()
    .then(r => {
      if (r.success && r.data) {
        cachedGenres = r.data
        cachedGenresTime = Date.now()
        return r.data
      }
      return cachedGenres || []
    })
    .catch(() => cachedGenres || [])
    .finally(() => {
      genresInFlight = null
    })

  return genresInFlight
}

async function getCachedTags(): Promise<TagOption[]> {
  const now = Date.now()
  if (cachedTags && now - cachedTagsTime < CACHE_TTL_MS) return cachedTags
  if (tagsInFlight) return tagsInFlight

  tagsInFlight = MetaService.getTags()
    .then(r => {
      if (r.success && r.data) {
        cachedTags = r.data
        cachedTagsTime = Date.now()
        return r.data
      }
      return cachedTags || []
    })
    .catch(() => cachedTags || [])
    .finally(() => {
      tagsInFlight = null
    })

  return tagsInFlight
}

/**
 * Unified pure function for transforming story objects into BrowseStory format
 * Eliminates double-transformation overhead between server and client.
 */
export function formatBrowseStory(story: any): BrowseStory {
  const genreName = typeof story.genre === "object" && story.genre !== null
    ? (story.genre.name ?? "General")
    : getGenreName(story.genre)

  const languageName = typeof story.language === "object" && story.language !== null
    ? (story.language.name ?? "")
    : (story.language ?? "")

  const tags: string[] = Array.isArray(story.tags)
    ? story.tags.map((t: any) => (typeof t === "string" ? t : (t?.name ?? ""))).filter(Boolean)
    : []

  const authorName = typeof story.author === "object" && story.author !== null
    ? (story.author.name || story.author.username || "Unknown Author")
    : (story.author || "Unknown Author")

  const viewCount = story.viewCount ?? story.readCount ?? 0
  const chapterCount = story.chapterCount ?? story._count?.chapters ?? undefined

  return {
    id: story.id,
    title: story.title,
    author: authorName,
    genre: genreName,
    language: languageName,
    status: story.status || "ongoing",
    coverImage: story.coverImage
      ? ImageService.getImageUrl(story.coverImage) || "/placeholder.svg"
      : "/placeholder.svg",
    excerpt: story.description ?? story.excerpt ?? undefined,
    description: story.description ?? undefined,
    likeCount: story.likeCount ?? 0,
    commentCount: story.commentCount ?? 0,
    viewCount,
    chapterCount,
    readTime: Math.ceil((story.wordCount || 0) / 200),
    date: story.createdAt ? new Date(story.createdAt) : new Date(),
    createdAt: story.createdAt ? new Date(story.createdAt) : new Date(),
    updatedAt: story.updatedAt ? new Date(story.updatedAt) : new Date(),
    slug: story.slug ?? undefined,
    tags,
    isMature: story.isMature || false,
    isBookmarked: false,
  }
}


export function useBrowseFilters(initialParams: BrowseParams, initialData: BrowseResult) {
  const { toast } = useToast()
  const pathname = usePathname()

  const [stories, setStories] = useState<BrowseStory[]>(() =>
    initialData.stories.map(formatBrowseStory)
  )
  const [loading, setLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialParams.search || "")
  const [allGenres, setAllGenres] = useState<GenreOption[]>(() => cachedGenres || [])

  const [selectedGenres, setSelectedGenres] = useState<string[]>(() => {
    const slug = initialParams.genre ? safeDecodeURIComponent(initialParams.genre) : null
    return slug ? [slug] : []
  })

  const [allTags, setAllTags] = useState<TagOption[]>(() => cachedTags || [])

  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (initialParams.tags) {
      return initialParams.tags
        .split(",")
        .map(t => safeDecodeURIComponent(t.trim()))
        .filter((t): t is string => t !== null)
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
  const [currentPage, setCurrentPage] = useState(parseInt(initialParams.page || "1", 10))
  const [totalPages, setTotalPages] = useState(initialData.pagination.totalPages)
  const [totalStories, setTotalStories] = useState(initialData.pagination.total)
  const isInitialMount = useRef(true)

  const observerTargetRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const hasMore = currentPage < totalPages

  // ── Load Genres & Tags with Singleton Cache ──────────────────────────────
  useEffect(() => {
    if (!cachedGenres) {
      getCachedGenres().then(genres => {
        if (genres.length > 0) setAllGenres(genres)
      })
    }
    if (!cachedTags) {
      getCachedTags().then(tags => {
        if (tags.length > 0) setAllTags(tags)
      })
    }
  }, [])

  // ── Sync Tag Name from Slug ─────────────────────────────────────────────
  useEffect(() => {
    if (!initialParams.tag || allTags.length === 0 || selectedTags.length !== 1) return

    const found = allTags.find(t => t.slug === selectedTags[0])
    if (found && found.name !== selectedTags[0]) {
      setSelectedTags([found.name])
    }
  }, [allTags, initialParams.tag, selectedTags])

  // ── Keep Stable Ref for Filter State ─────────────────────────────────────
  const currentFiltersRef = useRef({
    searchQuery,
    selectedGenres,
    allGenres,
    selectedTags,
    selectedLanguage,
    storyStatus,
    sortBy,
  })

  currentFiltersRef.current = {
    searchQuery,
    selectedGenres,
    allGenres,
    selectedTags,
    selectedLanguage,
    storyStatus,
    sortBy,
  }

  // ── URL Synchronization ─────────────────────────────────────────────────
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()

    if (selectedGenres.length === 1) {
      const genre = allGenres.find(g => g.slug === selectedGenres[0])
      if (genre) params.set("genre", genre.slug)
    }

    if (searchQuery) params.set("search", searchQuery)
    if (sortBy !== "newest") params.set("sortBy", sortBy)
    if (storyStatus !== "all") params.set("status", storyStatus)
    if (selectedLanguage) params.set("language", selectedLanguage)
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","))

    const qs = params.toString()
    const base = pathname || "/browse"
    const target = qs ? `${base}?${qs}` : base
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", target)
    }
  }, [
    pathname,
    selectedGenres,
    selectedTags,
    searchQuery,
    sortBy,
    storyStatus,
    selectedLanguage,
    allGenres,
  ])

  useEffect(() => {
    updateURL()
  }, [updateURL])

  // ── Fetch Stories (Stable callback via currentFiltersRef) ─────────────────
  const fetchStories = useCallback(
    async (pageToFetch: number, isReset = false) => {
      if (isReset) {
        abortControllerRef.current?.abort()
        abortControllerRef.current = new AbortController()
        setLoading(true)
      } else {
        setIsFetchingMore(true)
      }
      setError(null)

      const {
        searchQuery: currentSearch,
        selectedGenres: currentGenres,
        allGenres: currentAllGenres,
        selectedTags: currentTags,
        selectedLanguage: currentLang,
        storyStatus: currentStatus,
        sortBy: currentSort,
      } = currentFiltersRef.current

      try {
        const queryParams: Record<string, any> = {
          page: pageToFetch,
          limit: STORIES_PER_PAGE,
          status: currentStatus,
          sortBy: currentSort,
        }

        if (currentSearch) queryParams.search = currentSearch

        if (currentGenres.length === 1) {
          const genre = currentAllGenres.find(g => g.slug === currentGenres[0])
          if (genre) queryParams.genre = genre.name
        }

        if (currentTags.length > 0) queryParams.tags = currentTags
        if (currentLang) queryParams.language = currentLang

        const response = await StoryService.getStories(queryParams)

        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch stories")
        }

        const fetchedStories = response.data.stories.map((s: any) => formatBrowseStory(s))

        if (isReset) {
          setStories(fetchedStories)
        } else {
          setStories(prev => {
            const existingIds = new Set(prev.map(s => s.id))
            const newUnique = fetchedStories.filter((s: BrowseStory) => !existingIds.has(s.id))
            return [...prev, ...newUnique]
          })
        }

        setCurrentPage(pageToFetch)
        setTotalPages(response.data.pagination.totalPages)
        setTotalStories(response.data.pagination.total)
      } catch {
        setError("Failed to load stories. Please try again later.")
        toast({ title: "Error", description: "Failed to load stories.", variant: "destructive" })
      } finally {
        setLoading(false)
        setIsFetchingMore(false)
      }
    },
    [toast]
  )

  // ── Debounced Filter Change Effect ──────────────────────────────────────
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const timer = setTimeout(() => fetchStories(1, true), 400)
    return () => clearTimeout(timer)
  }, [
    searchQuery,
    selectedGenres,
    selectedTags,
    selectedLanguage,
    storyStatus,
    sortBy,
    fetchStories,
  ])

  // ── Infinite Scroll Observer ────────────────────────────────────────────
  const fetchNextPage = useCallback(() => {
    if (loading || isFetchingMore || !hasMore) return
    fetchStories(currentPage + 1, false)
  }, [loading, isFetchingMore, hasMore, currentPage, fetchStories])

  useEffect(() => {
    const target = observerTargetRef.current
    if (!target || !hasMore || loading || isFetchingMore) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1, rootMargin: "250px" }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, loading, isFetchingMore, fetchNextPage])

  const handleBookmark = useCallback((id: string | number) => {
    setStories(prev =>
      prev.map(s => (s.id === id ? { ...s, isBookmarked: !s.isBookmarked } : s))
    )
  }, [])

  const resetAllFilters = useCallback(() => {
    setSearchQuery("")
    setSelectedGenres([])
    setSelectedTags([])
    setSelectedLanguage("")
    setStoryStatus("all")
    setSortBy("newest")
  }, [])

  return {
    stories,
    loading,
    isFetchingMore,
    error,
    hasMore,
    searchQuery,
    setSearchQuery,
    allGenres,
    selectedGenres,
    setSelectedGenres,
    allTags,
    selectedTags,
    setSelectedTags,
    selectedLanguage,
    setSelectedLanguage,
    storyStatus,
    setStoryStatus,
    sortBy,
    setSortBy,
    totalStories,
    observerTargetRef,
    handleBookmark,
    resetAllFilters,
  }
}
