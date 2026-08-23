"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { StoryService } from "@/lib/api/story"
import { ChapterService } from "@/lib/api/chapter"
import { ViewAPI } from "@/lib/api/view"
import { logError } from "@/lib/error-logger"
import type { Story, Chapter } from "@/types/story"

interface UseChapterDataOptions {
  initialStory: Story
  initialChapter: Chapter
  initialChapters: Chapter[]
  slug: string
  userId?: string
}

export function useChapterData({
  initialStory,
  initialChapter,
  initialChapters,
  slug,
  userId,
}: UseChapterDataOptions) {
  const router = useRouter()
  const { toast } = useToast()

  const [story, setStory] = useState<Story>(initialStory)
  const [chapter, setChapter] = useState<Chapter>(initialChapter)
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [isContentLoading, setIsContentLoading] = useState(false)
  const [isChapterLiked, setIsChapterLiked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  // Track chapter view on mount or chapter switch
  useEffect(() => {
    if (!chapter?.id) return

    ViewAPI.trackChapterView(chapter.id).catch(err => {
      console.error("Failed to track chapter view:", err)
    })
  }, [chapter?.id])

  // Fetch initial chapter like and author follow state
  useEffect(() => {
    if (!userId || !chapter?.id || !story) return

    const fetchInitialStates = async () => {
      try {
        const likeResponse = await ChapterService.checkChapterLike(chapter.id)
        if (likeResponse.success && likeResponse.data !== undefined) {
          setIsChapterLiked(Boolean(likeResponse.data))
        }

        const author = story.author
        if (
          author &&
          typeof author === "object" &&
          author.id !== userId &&
          author.username
        ) {
          const followResponse = await StoryService.isFollowingUser(author.username)
          if (followResponse.success && followResponse.data !== undefined) {
            setIsFollowing(followResponse.data === true)
          }
        }
      } catch (err) {
        logError(err, { context: "Error fetching initial chapter states", chapterId: chapter.id, userId })
      }
    }

    fetchInitialStates()
  }, [userId, chapter?.id, story])

  // Fetch chapter without full page navigation
  const fetchChapterData = useCallback(
    async (targetChapterNumber: number) => {
      if (!story) return false

      setIsContentLoading(true)

      try {
        const targetSummary = chapters.find(c => c.number === targetChapterNumber)
        if (!targetSummary) {
          toast({ title: "Error", description: "Chapter not found", variant: "destructive" })
          return false
        }

        const response = await ChapterService.getChapter(targetSummary.id)
        if (!response.success || !response.data) {
          toast({ title: "Error", description: "Failed to load chapter", variant: "destructive" })
          return false
        }

        const details = response.data
        if (details.status !== "published") {
          toast({
            title: "Unavailable",
            description: "This chapter is not yet published",
            variant: "destructive",
          })
          return false
        }

        setChapter(details)

        // Update URL and browser history smoothly without full reload
        window.history.pushState(
          {},
          "",
          `/story/${slug}/chapter/${targetChapterNumber}`
        )

        // Scroll to top of content
        window.scrollTo({ top: 0, behavior: "smooth" })

        // Check like status for new chapter
        if (userId) {
          const likeResponse = await ChapterService.checkChapterLike(details.id)
          if (likeResponse.success && likeResponse.data !== undefined) {
            setIsChapterLiked(Boolean(likeResponse.data))
          }
        }

        return true
      } catch (err) {
        logError(err, { context: "Error loading chapter data", storyId: story.id, chapterNumber: targetChapterNumber })
        toast({ title: "Error", description: "Failed to load chapter", variant: "destructive" })
        return false
      } finally {
        setIsContentLoading(false)
      }
    },
    [story, chapters, slug, userId, toast]
  )

  const navigateToChapter = useCallback(
    async (direction: "prev" | "next") => {
      const currentIndex = chapters.findIndex(c => c.number === chapter.number)
      if (currentIndex === -1) return

      if (direction === "prev" && currentIndex > 0) {
        const targetChapter = chapters[currentIndex - 1]
        const success = await fetchChapterData(targetChapter.number)
        if (!success) {
          router.push(`/story/${slug}/chapter/${targetChapter.number}`)
        }
        return
      }

      if (direction === "next" && currentIndex < chapters.length - 1) {
        const targetChapter = chapters[currentIndex + 1]
        const success = await fetchChapterData(targetChapter.number)
        if (!success) {
          router.push(`/story/${slug}/chapter/${targetChapter.number}`)
        }
      }
    },
    [chapters, chapter.number, fetchChapterData, router, slug]
  )

  return {
    story,
    setStory,
    chapter,
    setChapter,
    chapters,
    setChapters,
    isContentLoading,
    isChapterLiked,
    setIsChapterLiked,
    isFollowing,
    setIsFollowing,
    fetchChapterData,
    navigateToChapter,
  }
}
