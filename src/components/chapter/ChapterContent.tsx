"use client"

import { motion } from "framer-motion"
import AdBanner from "@/components/ad-banner"
import { Chapter } from "@/types/story"

interface ChapterContentProps {
  chapter: Chapter
  contentLength: 'short' | 'medium' | 'long'
  fontSize: number
  handleCopyAttempt: (e: React.ClipboardEvent | React.MouseEvent) => void
  contentRef: React.RefObject<HTMLDivElement>
}

export function ChapterContent({ 
  chapter, 
  contentLength, 
  fontSize, 
  handleCopyAttempt,
  contentRef 
}: ChapterContentProps) {
  // Function to split content for ad placement
  const splitContentForAds = (content: string, parts: number, partIndex: number): string => {
    if (typeof window === 'undefined') return '';
    
    // Parse the HTML content
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const elements = Array.from(doc.body.children)

    // If no elements, return empty string
    if (elements.length === 0) return ''

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
      className="prose prose-lg dark:prose-invert max-w-none mb-12"
      style={{ fontSize: `${fontSize}px` }}
    >
      {contentLength === 'long' ? (
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
          <AdBanner type="interstitial" className="my-8 w-full h-32" />

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
          <AdBanner type="interstitial" className="my-8 w-full h-32" />

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
          <AdBanner type="interstitial" className="my-8 w-full h-32" />

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
          <AdBanner type="interstitial" className="my-8 w-full h-32" />
        </>
      )}
    </motion.div>
  )
}
