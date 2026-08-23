"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AdBanner } from "@/components/common"
import type { ChapterContentProps } from "../types/reader.types"

export function ChapterContent({
  chapter,
  story,
  contentLength,
  fontSize,
  handleCopyAttempt,
  contentRef,
  isContentLoading = false,
}: ChapterContentProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Ads only for original and non-mature stories
  const shouldShowAds = Boolean(story.isOriginal && !story.isMature)

  // Split content for inline ad placement
  const splitContentForAds = (content: string, parts: number, partIndex: number): string => {
    if (!isHydrated) return content || ""
    if (!content) return ""

    const parser = new DOMParser()
    const doc = parser.parseFromString(content, "text/html")
    const elements = Array.from(doc.body.children)

    if (elements.length === 0) return content

    const elementsPerPart = Math.ceil(elements.length / parts)
    const startIndex = partIndex * elementsPerPart
    const endIndex = Math.min(startIndex + elementsPerPart, elements.length)

    if (startIndex >= elements.length) return ""

    const container = document.createElement("div")
    for (let i = startIndex; i < endIndex; i++) {
      container.appendChild(elements[i].cloneNode(true))
    }

    return container.innerHTML
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      ref={contentRef}
      className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none mb-8 sm:mb-12 relative chapter-content"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: "1.7",
      }}
    >
      {/* Loading Overlay */}
      {isContentLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      )}

      {!isHydrated ? (
        // During SSR, show full content without ads to prevent hydration mismatch
        <div
          className="content-protected"
          dangerouslySetInnerHTML={{ __html: chapter.content || "Content not available." }}
          onContextMenu={handleCopyAttempt}
          onCopy={handleCopyAttempt}
          onCut={handleCopyAttempt}
          onDrag={handleCopyAttempt}
          onDragStart={handleCopyAttempt}
        />
      ) : contentLength === "long" ? (
        // Long content: Show ads at 1/3 and 2/3
        <>
          <div
            className="content-protected"
            dangerouslySetInnerHTML={{
              __html: chapter.content
                ? splitContentForAds(chapter.content, 3, 0)
                : "Content not available.",
            }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />

          {shouldShowAds && (
            <div className="w-full py-2">
              <AdBanner
                type="banner"
                className="w-full max-w-[720px] h-[90px] mx-auto"
                slot="6596765108"
              />
            </div>
          )}

          <div
            className="content-protected"
            dangerouslySetInnerHTML={{
              __html: chapter.content
                ? splitContentForAds(chapter.content, 3, 1)
                : "",
            }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />

          {shouldShowAds && (
            <div className="w-full py-2">
              <AdBanner
                type="banner"
                className="w-full max-w-[720px] h-[90px] mx-auto"
                slot="6596765108"
              />
            </div>
          )}

          <div
            className="content-protected"
            dangerouslySetInnerHTML={{
              __html: chapter.content
                ? splitContentForAds(chapter.content, 3, 2)
                : "",
            }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />
        </>
      ) : contentLength === "medium" ? (
        // Medium content: Show one ad in the middle
        <>
          <div
            className="content-protected"
            dangerouslySetInnerHTML={{
              __html: chapter.content
                ? splitContentForAds(chapter.content, 2, 0)
                : "Content not available.",
            }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />

          {shouldShowAds && (
            <div className="w-full py-2">
              <AdBanner
                type="banner"
                className="w-full max-w-[720px] h-[90px] mx-auto"
                slot="6596765108"
              />
            </div>
          )}

          <div
            className="content-protected"
            dangerouslySetInnerHTML={{
              __html: chapter.content
                ? splitContentForAds(chapter.content, 2, 1)
                : "",
            }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />
        </>
      ) : (
        // Short content: Show full content then ad at the end
        <>
          <div
            className="content-protected"
            dangerouslySetInnerHTML={{ __html: chapter.content || "Content not available." }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />

          {shouldShowAds && (
            <div className="w-full py-2">
              <AdBanner
                type="banner"
                className="w-full max-w-[720px] h-[90px] mx-auto"
                slot="6596765108"
              />
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

export default ChapterContent
