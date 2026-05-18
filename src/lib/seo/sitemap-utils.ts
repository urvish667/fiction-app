/**
 * Utility functions for generating SEO-optimized sitemap entries
 */

import { slugify } from '@/lib/utils'

export interface SitemapEntry {
  url: string
  lastModified?: Date | string
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

/**
 * Main genre list used for browse page sitemap entries.
 * Only includes primary genres — no language/filter combinations
 * to avoid diluting crawl budget with thin aggregation pages.
 */
const MAIN_GENRES = [
  'Fantasy',
  'Science Fiction',
  'Romance',
  'Mystery',
  'Horror',
  'Young Adult',
  'Historical',
  'Thriller',
  'Adventure',
  'Slice of Life',
  'Fanfiction',
  'Drama',
  'Comedy',
  'Non-Fiction',
  'Memoir',
  'Biography',
  'Self-Help',
  'Children',
  'Crime',
  'Poetry',
  'LGBTQ+',
  'Short Story',
  'Urban',
  'Paranormal',
  'Dystopian',
] as const

/**
 * Generate sitemap entries for browse/category pages.
 * Includes the main /browse page and one entry per genre.
 * Language combinations are intentionally excluded to preserve crawl budget.
 */
export function generateBrowseSitemapEntries(): SitemapEntry[] {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'

  const entries: SitemapEntry[] = MAIN_GENRES.map(genre => ({
    url: `${baseUrl}/browse?genre=${encodeURIComponent(slugify(genre))}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return entries
}

/**
 * Validate and sanitize sitemap entries.
 *
 * IMPORTANT: Do NOT manually escape XML entities here.
 * Next.js's MetadataRoute.Sitemap handles XML serialization automatically.
 * Manual escaping causes double-encoding (e.g. &amp;amp;) which breaks
 * sitemap validation in Google Search Console.
 */
export function validateSitemapEntries<T extends { url: string; lastModified?: Date | string; priority?: number }>(entries: T[]): T[] {
  const seen = new Set<string>()

  return entries
    .filter(entry => {
      // Validate URL format
      try {
        new URL(entry.url)
      } catch {
        return false
      }

      // Deduplicate URLs
      if (seen.has(entry.url)) {
        return false
      }
      seen.add(entry.url)

      return true
    })
    .map(entry => ({
      ...entry,
      // Clamp priority to valid 0–1 range
      priority: entry.priority != null
        ? Math.max(0, Math.min(1, entry.priority))
        : undefined,
      // Ensure lastModified is a valid Date not in the future
      lastModified: normalizeDate(entry.lastModified),
    }))
}

/**
 * Safely encode a slug for use in sitemap URLs.
 * Handles slugs that may contain spaces or special characters.
 */
export function encodeSitemapSlug(slug: string): string {
  return encodeURIComponent(slug)
}

function normalizeDate(date: Date | string | undefined): Date | undefined {
  if (!date) return undefined

  const parsed = date instanceof Date ? date : new Date(date)
  if (isNaN(parsed.getTime())) return undefined

  // Cap at current time to avoid future dates
  const now = new Date()
  return parsed > now ? now : parsed
}
