"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { StoryService } from "@/lib/api/story"
import { MetaService } from "@/lib/api/meta"
import { ImageService } from "@/lib/api/images"
import { safeDecodeURIComponent } from "@/utils/safe-decode-uri-component"
import { getGenreName } from "@/features/story"
import type { BrowseParams, BrowseStory, GenreOption, TagOption } from "../types/browse.types"
import type { BrowseResult } from "@/lib/server/browse-data"

const STORIES_PER_PAGE = 16

export function useStoryTransformer() {
  const transformServerStory = useCallback((story: BrowseResult["stories"][0]): BrowseStory => ({
    id: story.id,
    title: story.title,
    author: story.author.username || story.author.name || "Unknown Author",
    genre: story.genre?.name ?? "General",
    language: story.language?.name ?? "",
    status: story.status || "ongoing",
    coverImage: story.coverImage
      ? ImageService.getImageUrl(story.coverImage) || "/placeholder.svg"
      : "/placeholder.svg",
    excerpt: story.description ?? undefined,
    description: story.description ?? undefined,
    likeCount: story.likeCount ?? 0,
    commentCount: story.commentCount ?? 0,
    viewCount: story.viewCount ?? 0,
    chapterCount: story.chapterCount,
    readTime: Math.ceil((story.wordCount || 0) / 200),
    date: story.createdAt ? new Date(story.createdAt) : undefined,
    createdAt: story.createdAt ? new Date(story.createdAt) : undefined,
    updatedAt: story.updatedAt ? new Date(story.updatedAt) : undefined,
    slug: story.slug ?? undefined,
    tags: story.tags.map(t => t.name),
    isMature: story.isMature || false,
    isBookmarked: false,
  }), [])

  const formatApiStory = useCallback((story: Record<string, any>): BrowseStory => {
    const genreName = getGenreName(story.genre)
    const languageName = (typeof story.language === "object" && story.language !== null ? story.language.name : story.language) ?? ""
    const tags: string[] = Array.isArray(story.tags)
      ? story.tags.map((t: any) => typeof t === "string" ? t : (t?.name ?? "")).filter(Boolean)
      : []

    return {
      id: story.id,
      title: story.title,
      author: typeof story.author === "object" && story.author !== null
        ? story.author.name || story.author.username || "Unknown Author"
        : story.author || "Unknown Author",
      genre: genreName,
      language: languageName,
      status: story.status || "ongoing",
      coverImage: story.coverImage
        ? ImageService.getImageUrl(story.coverImage) || "/placeholder.svg"
        : "/placeholder.svg",
      excerpt: story.description ?? undefined,
      description: story.description ?? undefined,
      likeCount: story.likeCount ?? 0,
      commentCount: story.commentCount ?? 0,
      viewCount: story.viewCount ?? story.readCount ?? 0,
      chapterCount: story.chapterCount ?? story._count?.chapters ?? undefined,
      readTime: Math.ceil((story.wordCount || 0) / 200),
      date: story.createdAt ? new Date(story.createdAt) : new Date(),
      createdAt: story.createdAt ? new Date(story.createdAt) : new Date(),
      updatedAt: story.updatedAt ? new Date(story.updatedAt) : new Date(),
      slug: story.slug ?? undefined,
      tags,
      isMature: story.isMature || false,
      isBookmarked: false,
    }
  }, [])

  return { transformServerStory, formatApiStory }
}

export function useBrowseFilters(initialParams: BrowseParams, initialData: BrowseResult) {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const { transformServerStory, formatApiStory } = useStoryTransformer()

  const [stories, setStories] = useState<BrowseStory[]>(() =>
    initialData.stories.map(transformServerStory)
  )
  const [loading, setLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialParams.search || "")
  const [allGenres, setAllGenres] = useState<GenreOption[]>([])

  const [selectedGenres, setSelectedGenres] = useState<string[]>(() => {
    const slug = initialParams.genre ? safeDecodeURIComponent(initialParams.genre) : null
    return slug ? [slug] : []
  })

  const [allTags, setAllTags] = useState<TagOption[]>([])

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
  const [initialFetchDone, setInitialFetchDone] = useState(false)

  const observerTargetRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const hasMore = currentPage < totalPages

  // ── Load Genres & Tags ──────────────────────────────────────────────────
  useEffect(() => {
    MetaService.getGenres()
      .then(r => {
        if (r.success && r.data) setAllGenres(r.data)
      })
      .catch(() => {})

    MetaService.getTags()
      .then(r => {
        if (r.success && r.data) setAllTags(r.data)
      })
      .catch(() => {})
  }, [])

  // ── Sync Tag Name from Slug ─────────────────────────────────────────────
  useEffect(() => {
    if (!initialParams.tag || allTags.length === 0 || selectedTags.length !== 1) return

    const found = allTags.find(t => t.slug === selectedTags[0])
    if (found && found.name !== selectedTags[0]) {
      setSelectedTags([found.name])
    }
  }, [allTags, initialParams.tag, selectedTags])

  // ── URL Synchronization ─────────────────────────────────────────────────
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()

    if (selectedGenres.length === 1) {
      const genre = allGenres.find(g => g.slug === selectedGenres[0])
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
  }, [
    pathname,
    router,
    selectedGenres,
    selectedTags,
    searchQuery,
    currentPage,
    sortBy,
    storyStatus,
    selectedLanguage,
    allGenres,
  ])

  useEffect(() => {
    updateURL()
  }, [updateURL])

  // ── Fetch Stories ───────────────────────────────────────────────────────
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

      try {
        const queryParams: Record<string, any> = {
          page: pageToFetch,
          limit: STORIES_PER_PAGE,
          status: storyStatus,
          sortBy,
        }

        if (searchQuery) queryParams.search = searchQuery

        if (selectedGenres.length === 1) {
          const genre = allGenres.find(g => g.slug === selectedGenres[0])
          if (genre) queryParams.genre = genre.name
        }

        if (selectedTags.length > 0) queryParams.tags = selectedTags
        if (selectedLanguage) queryParams.language = selectedLanguage

        const response = await StoryService.getStories(queryParams)

        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch stories")
        }

        const fetchedStories = response.data.stories.map((s: any) => formatApiStory(s))

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
    [
      storyStatus,
      sortBy,
      searchQuery,
      selectedGenres,
      allGenres,
      selectedTags,
      selectedLanguage,
      formatApiStory,
      toast,
    ]
  )

  // ── Debounced Filter Change Effect ──────────────────────────────────────
  useEffect(() => {
    const isInitialMatch =
      selectedGenres.length === (initialParams.genre ? 1 : 0) &&
      currentPage === parseInt(initialParams.page || "1", 10) &&
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
  }, [
    searchQuery,
    selectedGenres,
    selectedTags,
    selectedLanguage,
    storyStatus,
    sortBy,
    currentPage,
    initialFetchDone,
    initialParams,
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
