/**
 * Utility functions for generating SEO-optimized sitemap entries
 */

import { slugify } from '@/lib/utils'

export interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

/**
 * Generate sitemap entries for category pages
 */
export function generateCategorySitemapEntries(): SitemapEntry[] {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  
  // Main categories with high priority
  const mainCategories = [
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
  ]

  const entries: SitemapEntry[] = []

  // Main browse page
  entries.push({
    url: `${baseUrl}/browse`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9
  })

  // Main category pages
  mainCategories.forEach(category => {
    entries.push({
      url: `${baseUrl}/browse?genre=${encodeURIComponent(slugify(category))}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8
    })
  })

  // Popular language combinations
  const popularLanguages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese']
  
  mainCategories.slice(0, 4).forEach(category => {
    popularLanguages.slice(0, 3).forEach(language => {
      if (language !== 'English') { // English is default
        entries.push({
          url: `${baseUrl}/browse?genre=${encodeURIComponent(slugify(category))}&language=${encodeURIComponent(language)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.5
        })
      }
    })
  })

  return entries
}

/**
 * Generate all browse-related sitemap entries
 */
export function generateBrowseSitemapEntries(): SitemapEntry[] {
  return [
    ...generateCategorySitemapEntries(),
  ]
}

/**
 * Escape XML entities in URLs for sitemap compatibility
 */
function escapeXmlEntities(url: string): string {
  return url
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Validate and sanitize sitemap entries
 */
export function validateSitemapEntries(entries: any[]): any[] {
  return entries
    .filter(entry => {
      // Validate URL format
      try {
        new URL(entry.url)
        return true
      } catch {
        return false
      }
    })
    .map(entry => ({
      ...entry,
      // Escape XML entities in URL
      url: escapeXmlEntities(entry.url),
      // Ensure priority is within valid range
      priority: entry.priority ? Math.max(0, Math.min(1, entry.priority)) : undefined,
      // Ensure lastModified is not in the future and is a Date object
      lastModified: entry.lastModified
        ? (entry.lastModified instanceof Date
            ? (entry.lastModified > new Date() ? new Date() : entry.lastModified)
            : new Date(entry.lastModified))
        : undefined
    }))
}
