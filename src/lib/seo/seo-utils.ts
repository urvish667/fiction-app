import { Story } from "@/types/story"

/**
 * Truncate a story/chapter title to fit within SEO-safe limits.
 * Target: total <title> ≤ 70 chars including " | FableSpace" suffix (13 chars).
 * Leaves 57 chars for the title itself before truncating with an ellipsis.
 */
export function truncateTitle(rawTitle: string, suffixLen = 13): string {
  const maxTitleChars = 70 - suffixLen
  if (rawTitle.length <= maxTitleChars) return rawTitle
  return rawTitle.slice(0, maxTitleChars - 1).trimEnd() + '\u2026'
}

/**
 * Safely convert a date to ISO string, handling both Date objects and string dates
 */
export function toISOString(date: Date | string | undefined): string | undefined {
  if (!date) return undefined
  if (date instanceof Date) return date.toISOString()
  if (typeof date === 'string') return date
  return undefined
}

/**
 * Safely extract author name from a story
 */
export function getAuthorName(story: Story): string {
  if (story.author && typeof story.author === 'object') {
    return story.author.name || story.author.username || 'Unknown Author'
  }
  return 'Unknown Author'
}

/**
 * Safely extract author username from a story
 */
export function getAuthorUsername(story: Story): string {
  if (story.author && typeof story.author === 'object') {
    return story.author.username || 'unknown'
  }
  return 'unknown'
}

/**
 * Safely extract genre name from a story
 */
export function getGenreName(story: Story): string {
  return story.genre?.name ?? 'Fiction'
}

/**
 * HTML tag and basic markdown stripping for dynamic page metadata.
 */
export function cleanTextForDescription(text: string): string {
  if (!text) return ''

  // 1. Strip HTML tags
  let clean = text.replace(/<[^>]*>/g, ' ')

  // 2. Strip Markdown syntax
  clean = clean.replace(/!\[([^\]]*)\]\([^)]*\)/g, '') // remove images
  clean = clean.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // keep link text
  clean = clean.replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
  clean = clean.replace(/(\*|_)(.*?)\1/g, '$2') // italic
  clean = clean.replace(/~~(.*?)~~/g, '$1') // strikethrough
  clean = clean.replace(/`([^`]+)`/g, '$1') // inline code
  clean = clean.replace(/^#+\s+/gm, '') // headings
  clean = clean.replace(/^>\s+/gm, '') // blockquotes
  clean = clean.replace(/^[-*+]\s+/gm, '') // bullet lists
  clean = clean.replace(/^\d+\.\s+/gm, '') // numbered lists

  // 3. Collapse whitespace
  return clean.replace(/\s+/g, ' ').trim()
}

/**
 * Truncate description at sentence boundaries or word boundaries.
 */
export function truncateDescription(text: string, maxLength = 155): string {
  if (text.length <= maxLength) return text

  const minBufferLength = 110
  const sentenceEndRegex = /[.!?]\s/g
  let match
  let lastSentenceEnd = -1

  while ((match = sentenceEndRegex.exec(text)) !== null) {
    const endIndex = match.index + 1
    if (endIndex >= minBufferLength && endIndex <= maxLength) {
      lastSentenceEnd = endIndex
    }
  }

  if (lastSentenceEnd !== -1) {
    return text.slice(0, lastSentenceEnd)
  }

  const truncated = text.slice(0, maxLength - 3)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > minBufferLength) {
    return text.slice(0, lastSpace).trim() + '...'
  }

  return truncated.trim() + '...'
}

/**
 * Strip HTML tags and return plain text content.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Count words in a string of text.
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}
