"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import AdBanner from "@/components/ad-banner"
import { Chapter } from "@/types/story"

interface ChapterContentProps {
  chapter: Chapter
  contentLength: 'short' | 'medium' | 'long'
  fontSize: number
  handleCopyAttempt: (e: React.ClipboardEvent | React.MouseEvent) => void
  contentRef: React.RefObject<HTMLDivElement>
  isContentLoading?: boolean
}

export function ChapterContent({
  chapter,
  contentLength,
  fontSize,
  handleCopyAttempt,
  contentRef,
  isContentLoading = false
}: ChapterContentProps) {
  // Track if component has hydrated to avoid SSR/client mismatch
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Function to split content for ad placement
  const splitContentForAds = (content: string, parts: number, partIndex: number): string => {
    // During SSR or before hydration, return the full content to avoid hydration mismatch
    if (!isHydrated) {
      return content || '';
    }

    // Parse the HTML content
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const elements = Array.from(doc.body.children)

    // If no elements, return the original content
    if (elements.length === 0) return content || ''

    // Calculate the number of elements per part
    const elementsPerPart = Math.ceil(elements.length / parts)

    // Calculate start and end indices for the requested part
    const startIndex = partIndex * elementsPerPart
    const endIndex = Math.min(startIndex + elementsPerPart, elements.length)

    // If indices are out of range, return empty string
    if (startIndex >= elements.length) return ''

    // Create a container for the part
    const container = document.createElement('div')

    // Add the elements for this part to the container
    for (let i = startIndex; i < endIndex; i++) {
      container.appendChild(elements[i].cloneNode(true))
    }

    // Return the HTML of the container
    return container.innerHTML
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      ref={contentRef}
      className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none mb-8 sm:mb-12 relative"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: '1.7',
        '--tw-prose-body': 'rgb(75 85 99)',
        '--tw-prose-headings': 'rgb(17 24 39)',
        '--tw-prose-lead': 'rgb(75 85 99)',
        '--tw-prose-links': 'rgb(59 130 246)',
        '--tw-prose-bold': 'rgb(17 24 39)',
        '--tw-prose-counters': 'rgb(107 114 128)',
        '--tw-prose-bullets': 'rgb(209 213 219)',
        '--tw-prose-hr': 'rgb(229 231 235)',
        '--tw-prose-quotes': 'rgb(17 24 39)',
        '--tw-prose-quote-borders': 'rgb(229 231 235)',
        '--tw-prose-captions': 'rgb(107 114 128)',
        '--tw-prose-code': 'rgb(17 24 39)',
        '--tw-prose-pre-code': 'rgb(229 231 235)',
        '--tw-prose-pre-bg': 'rgb(17 24 39)',
        '--tw-prose-th-borders': 'rgb(209 213 219)',
        '--tw-prose-td-borders': 'rgb(229 231 235)'
      } as React.CSSProperties}
    >
      {/* Loading overlay */}
      {isContentLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      {!isHydrated ? (
        // During SSR, show full content without ads to avoid hydration mismatch
        <div
          className="content-protected"
          dangerouslySetInnerHTML={{ __html: chapter.content || 'Content not available.' }}
          onContextMenu={handleCopyAttempt}
          onCopy={handleCopyAttempt}
          onCut={handleCopyAttempt}
          onDrag={handleCopyAttempt}
          onDragStart={handleCopyAttempt}
        />
      ) : contentLength === 'long' ? (
        // For long content: Show ads at 1/3 and 2/3 of the content
        <>
          {/* First third of content */}
          <div
            className="content-protected"
            dangerouslySetInnerHTML={{
              __html: chapter.content ?
                splitContentForAds(chapter.content, 3, 0) :
                'Content not available.'
            }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />

          {/* First ad after 1/3 of content */}
          <AdBanner type="interstitial" className="my-6 sm:my-8 w-full h-24 sm:h-32" />

          {/* Second third of content */}
          <div
            className="content-protected"
            dangerouslySetInnerHTML={{
              __html: chapter.content ?
                splitContentForAds(chapter.content, 3, 1) :
                ''
            }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />

          {/* Second ad after 2/3 of content */}
          <AdBanner type="interstitial" className="my-6 sm:my-8 w-full h-24 sm:h-32" />

          {/* Final third of content */}
          <div
            className="content-protected"
            dangerouslySetInnerHTML={{
              __html: chapter.content ?
                splitContentForAds(chapter.content, 3, 2) :
                ''
            }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />
        </>
      ) : contentLength === 'medium' ? (
        // For medium content: Show one ad in the middle
        <>
          {/* First half of content */}
          <div
            className="content-protected"
            dangerouslySetInnerHTML={{
              __html: chapter.content ?
                splitContentForAds(chapter.content, 2, 0) :
                'Content not available.'
            }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />

          {/* Ad in the middle */}
          <AdBanner type="interstitial" className="my-6 sm:my-8 w-full h-24 sm:h-32" />

          {/* Second half of content */}
          <div
            className="content-protected"
            dangerouslySetInnerHTML={{
              __html: chapter.content ?
                splitContentForAds(chapter.content, 2, 1) :
                ''
            }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />
        </>
      ) : (
        // For short content: Show content first, then ad at the end
        <>
          {/* Full content */}
          <div
            className="content-protected"
            dangerouslySetInnerHTML={{ __html: chapter.content || 'Content not available.' }}
            onContextMenu={handleCopyAttempt}
            onCopy={handleCopyAttempt}
            onCut={handleCopyAttempt}
            onDrag={handleCopyAttempt}
            onDragStart={handleCopyAttempt}
          />

          {/* Ad at the end */}
          <AdBanner type="interstitial" className="my-6 sm:my-8 w-full h-24 sm:h-32" />
        </>
      )}
    </motion.div>
  )
}
