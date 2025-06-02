/**
 * Utility functions for generating SEO-optimized sitemap entries
 */

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'
  
  // Main categories with high priority
  const mainCategories = [
    'Fantasy',
    'Science Fiction', 
    'Romance',
    'Mystery',
    'Horror',
    'Young Adult',
    'Historical',
    'Thriller'
  ]

  // Additional categories with medium priority
  const additionalCategories = [
    'Adventure',
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
    'Slice of Life',
    'Fanfiction'
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
      url: `${baseUrl}/browse?genre=${encodeURIComponent(category)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8
    })

    // Category with status filters
    entries.push({
      url: `${baseUrl}/browse?genre=${encodeURIComponent(category)}&status=completed`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7
    })

    entries.push({
      url: `${baseUrl}/browse?genre=${encodeURIComponent(category)}&status=ongoing`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7
    })
  })

  // Additional category pages
  additionalCategories.forEach(category => {
    entries.push({
      url: `${baseUrl}/browse?genre=${encodeURIComponent(category)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6
    })
  })

  // Popular language combinations
  const popularLanguages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese']
  
  mainCategories.slice(0, 4).forEach(category => {
    popularLanguages.slice(0, 3).forEach(language => {
      if (language !== 'English') { // English is default
        entries.push({
          url: `${baseUrl}/browse?genre=${encodeURIComponent(category)}&language=${encodeURIComponent(language)}`,
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
 * Generate sitemap entries for popular search terms
 */
export function generateSearchSitemapEntries(): SitemapEntry[] {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'
  
  const popularSearchTerms = [
    'magic',
    'romance',
    'adventure',
    'mystery',
    'dragons',
    'space',
    'love story',
    'detective',
    'supernatural',
    'teen fiction',
    'historical romance',
    'sci-fi',
    'fantasy adventure',
    'young adult romance',
    'mystery thriller'
  ]

  return popularSearchTerms.map(term => ({
    url: `${baseUrl}/browse?search=${encodeURIComponent(term)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.4
  }))
}

/**
 * Generate all browse-related sitemap entries
 */
export function generateBrowseSitemapEntries(): SitemapEntry[] {
  return [
    ...generateCategorySitemapEntries(),
    ...generateSearchSitemapEntries()
  ]
}

/**
 * Validate and sanitize sitemap entries
 */
export function validateSitemapEntries(entries: SitemapEntry[]): SitemapEntry[] {
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
      // Ensure priority is within valid range
      priority: entry.priority ? Math.max(0, Math.min(1, entry.priority)) : undefined,
      // Ensure lastModified is not in the future
      lastModified: entry.lastModified && entry.lastModified > new Date() 
        ? new Date() 
        : entry.lastModified
    }))
}
