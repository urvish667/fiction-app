/**
 * Tests for category-based SEO functionality
 */

import { 
  generateBrowseMetadata, 
  generateBrowseStructuredData,
  generateCategoryFAQStructuredData,
  generateCategoryWebPageStructuredData
} from '../metadata'
import { generateBrowseSitemapEntries, validateSitemapEntries } from '../sitemap-utils'

// Mock environment variable
const originalEnv = process.env.NEXT_PUBLIC_APP_URL
beforeAll(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://test.fablespace.com'
})

afterAll(() => {
  process.env.NEXT_PUBLIC_APP_URL = originalEnv
})

describe('Category-based SEO Metadata', () => {
  describe('generateBrowseMetadata', () => {
    it('should generate basic browse metadata', () => {
      const metadata = generateBrowseMetadata()
      
      expect(metadata.title).toBe('Browse Stories - FableSpace')
      expect(metadata.description).toContain('Discover amazing stories on FableSpace')
      expect(metadata.keywords).toContain('browse stories')
      expect(metadata.alternates?.canonical).toBe('https://test.fablespace.com/browse')
    })

    it('should generate genre-specific metadata', () => {
      const metadata = generateBrowseMetadata({ genre: 'Fantasy' })
      
      expect(metadata.title).toBe('Fantasy Stories - Browse Fantasy Fiction - FableSpace')
      expect(metadata.description).toContain('magical worlds')
      expect(metadata.keywords).toContain('fantasy fiction')
      expect(metadata.alternates?.canonical).toBe('https://test.fablespace.com/browse?genre=Fantasy')
      expect(metadata.category).toBe('Fantasy')
    })

    it('should generate search-specific metadata', () => {
      const metadata = generateBrowseMetadata({ search: 'dragons' })
      
      expect(metadata.title).toBe('"dragons" Stories - Search Results - FableSpace')
      expect(metadata.description).toContain('Search results for "dragons"')
      expect(metadata.keywords).toContain('dragons')
    })

    it('should handle language-specific metadata', () => {
      const metadata = generateBrowseMetadata({ 
        genre: 'Romance', 
        language: 'Spanish' 
      })
      
      expect(metadata.title).toContain('in Spanish')
      expect(metadata.description).toContain('in Spanish')
      expect(metadata.keywords).toContain('spanish')
    })

    it('should handle status-specific metadata', () => {
      const metadata = generateBrowseMetadata({ 
        genre: 'Mystery', 
        status: 'completed' 
      })
      
      expect(metadata.title).toContain('Completed Mystery Stories')
      expect(metadata.description).toContain('completed mystery')
      expect(metadata.keywords).toContain('completed mystery')
    })

    it('should include story count in description', () => {
      const metadata = generateBrowseMetadata({ 
        genre: 'Fantasy',
        totalStories: 1500
      })
      
      expect(metadata.description).toContain('Browse 1,500 stories')
    })
  })

  describe('generateBrowseStructuredData', () => {
    it('should generate basic structured data', () => {
      const structuredData = generateBrowseStructuredData()
      
      expect(structuredData['@type']).toBe('CollectionPage')
      expect(structuredData.name).toBe('Browse Stories')
      expect(structuredData.url).toBe('https://test.fablespace.com/browse')
      expect(structuredData.publisher.name).toBe('FableSpace')
    })

    it('should generate genre-specific structured data', () => {
      const structuredData = generateBrowseStructuredData({ genre: 'Science Fiction' })
      
      expect(structuredData.name).toBe('Science Fiction Stories')
      expect(structuredData.description).toContain('cutting-edge sci-fi')
      expect(structuredData.keywords).toContain('sci-fi')
      expect(structuredData.url).toBe('https://test.fablespace.com/browse?genre=Science%20Fiction')
    })

    it('should include story count', () => {
      const structuredData = generateBrowseStructuredData({ 
        genre: 'Romance',
        totalStories: 500
      })
      
      expect(structuredData.numberOfItems).toBe(500)
    })

    it('should include language information', () => {
      const structuredData = generateBrowseStructuredData({ 
        genre: 'Fantasy',
        language: 'French'
      })
      
      expect(structuredData.inLanguage).toBe('French')
    })

    it('should generate ItemList for stories', () => {
      const mockStories = [
        {
          title: 'Test Story',
          author: { name: 'Test Author', username: 'testauthor' },
          genre: { name: 'Fantasy' },
          slug: 'test-story',
          coverImage: 'https://example.com/cover.jpg',
          description: 'A test story',
          wordCount: 5000,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02')
        }
      ]

      const structuredData = generateBrowseStructuredData({ 
        genre: 'Fantasy',
        stories: mockStories
      })
      
      expect(structuredData.mainEntity).toBeDefined()
      expect(structuredData.mainEntity['@type']).toBe('ItemList')
      expect(structuredData.mainEntity.numberOfItems).toBe(1)
      expect(structuredData.mainEntity.itemListElement[0].item.name).toBe('Test Story')
    })
  })

  describe('generateCategoryFAQStructuredData', () => {
    it('should generate FAQ structured data for a genre', () => {
      const faqData = generateCategoryFAQStructuredData('Fantasy')
      
      expect(faqData['@type']).toBe('FAQPage')
      expect(faqData.mainEntity).toHaveLength(4)
      expect(faqData.mainEntity[0].name).toContain('fantasy stories')
      expect(faqData.mainEntity[0].acceptedAnswer.text).toContain('fantasy')
    })
  })

  describe('generateCategoryWebPageStructuredData', () => {
    it('should generate WebPage structured data', () => {
      const webPageData = generateCategoryWebPageStructuredData({
        genre: 'Horror',
        totalStories: 200,
        language: 'English'
      })
      
      expect(webPageData['@type']).toBe('WebPage')
      expect(webPageData.name).toBe('Horror Stories - FableSpace')
      expect(webPageData.about.name).toBe('Horror Fiction')
      expect(webPageData.audience.audienceType).toBe('Horror readers')
      expect(webPageData.inLanguage).toBe('English')
    })
  })
})

describe('Sitemap Utilities', () => {
  describe('generateBrowseSitemapEntries', () => {
    it('should generate sitemap entries for categories', () => {
      const entries = generateBrowseSitemapEntries()
      
      expect(entries.length).toBeGreaterThan(0)
      
      // Check main browse page
      const browseEntry = entries.find(e => e.url.endsWith('/browse'))
      expect(browseEntry).toBeDefined()
      expect(browseEntry?.priority).toBe(0.9)
      
      // Check fantasy category
      const fantasyEntry = entries.find(e => e.url.includes('genre=Fantasy'))
      expect(fantasyEntry).toBeDefined()
      expect(fantasyEntry?.priority).toBe(0.8)
      
      // Check completed stories
      const completedEntry = entries.find(e => e.url.includes('status=completed'))
      expect(completedEntry).toBeDefined()
    })
  })

  describe('validateSitemapEntries', () => {
    it('should validate and sanitize sitemap entries', () => {
      const invalidEntries = [
        { url: 'invalid-url', priority: 1.5 },
        { url: 'https://valid.com', priority: -0.5 },
        { url: 'https://future.com', lastModified: new Date('2030-01-01') }
      ]
      
      const validatedEntries = validateSitemapEntries(invalidEntries)
      
      expect(validatedEntries).toHaveLength(2) // Invalid URL should be filtered out
      expect(validatedEntries[0].priority).toBe(1) // Clamped to max 1
      expect(validatedEntries[1].priority).toBe(0) // Clamped to min 0
    })
  })
})
