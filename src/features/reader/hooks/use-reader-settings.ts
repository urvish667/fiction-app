"use client"

import { useState, useCallback, useEffect } from "react"

const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 28
const DEFAULT_FONT_SIZE = 16
const STORAGE_KEY = "fablespace_reader_font_size"

export function useReaderSettings(initialFontSize = DEFAULT_FONT_SIZE) {
  const [fontSize, setFontSize] = useState(initialFontSize)

  // Hydrate font size from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return

      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) {
        setFontSize(parsed)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const adjustFontSize = useCallback((amount: number) => {
    setFontSize(prev => {
      const nextSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, prev + amount))
      try {
        localStorage.setItem(STORAGE_KEY, nextSize.toString())
      } catch {
        // Ignore localStorage errors
      }
      return nextSize
    })
  }, [])

  return {
    fontSize,
    adjustFontSize,
  }
}
