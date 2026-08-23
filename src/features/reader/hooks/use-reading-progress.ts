"use client"

import { useState, useEffect, useRef } from "react"
import { ChapterService } from "@/lib/api/chapter"

interface UseReadingProgressOptions {
  chapterId?: string
  initialProgress?: number
  isAuthenticated: boolean
  contentRef: React.RefObject<HTMLDivElement | null>
}

export function useReadingProgress({
  chapterId,
  initialProgress = 0,
  isAuthenticated,
  contentRef,
}: UseReadingProgressOptions) {
  const [readingProgress, setReadingProgress] = useState(initialProgress)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      const windowHeight = scrollHeight - clientHeight
      if (windowHeight <= 0) return

      const progress = (scrollTop / windowHeight) * 100
      const roundedProgress = Math.min(Math.round(progress), 100)

      setReadingProgress(prev => (roundedProgress !== prev ? roundedProgress : prev))
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [contentRef])

  // Sync reading progress to backend
  useEffect(() => {
    if (!isAuthenticated || !chapterId || readingProgress <= 0) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      ChapterService.updateReadingProgress(chapterId, readingProgress).catch(err => {
        console.error("Failed to sync reading progress:", err)
      })
    }, 2000)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [readingProgress, chapterId, isAuthenticated])

  return {
    readingProgress,
    setReadingProgress,
  }
}
