import { MetadataRoute } from 'next'
import { generateBrowseSitemapEntries, validateSitemapEntries } from '@/lib/seo/sitemap-utils'
import { SitemapService } from '@/lib/api/sitemap'

export const revalidate = 86400 // Revalidate once every day


/**
 * Dynamic sitemap generation for FableSpace
 * 
 * Includes:
 * - Static pages (home, about, contact, privacy, terms, blog, challenges)
 * - Browse pages with query parameters (server-side rendered for SEO)
 * - Story and chapter pages (published only)
 * - Blog posts (published only)
 * - User profiles (public profiles only)
 * - Author forums (only those enabled by authors in preferences)
 * - Tag pages
 * 
 * Note: Browse pages with query parameters (e.g., /browse?genre=fantasy) are
 * server-side rendered with initial data, making them fully crawlable by Google.
 * The XML entity escaping ensures proper sitemap format while maintaining valid URLs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'

  // Static pages with their priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/challenges`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  try {
    // Fetch data from backend APIs
    const [stories, tags, blogs, users, usersWithForums] = await Promise.all([
      SitemapService.getStories(),
      SitemapService.getTags(),
      SitemapService.getBlogs(),
      SitemapService.getUsers(),
      SitemapService.getForums(),
    ])

    // Generate story pages
    const storyPages: MetadataRoute.Sitemap = stories.map((story) => ({
      url: `${baseUrl}/story/${story.slug}`,
      lastModified: new Date(story.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Generate chapter pages
    const chapterPages: MetadataRoute.Sitemap = stories.flatMap((story) =>
      story.chapters.map((chapter) => ({
        url: `${baseUrl}/story/${story.slug}/chapter/${chapter.number}`,
        lastModified: new Date(chapter.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))
    )

    // Generate tag pages
    const tagPages: MetadataRoute.Sitemap = tags.map(tag => ({
      url: `${baseUrl}/browse?tag=${encodeURIComponent(tag.slug)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Generate blog pages
    const blogPages: MetadataRoute.Sitemap = blogs.map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: new Date(blog.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Generate user profile pages
    const userPages: MetadataRoute.Sitemap = users.map((user) => ({
      url: `${baseUrl}/user/${user.username}`,
      lastModified: new Date(user.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Generate forum pages
    const forumPages: MetadataRoute.Sitemap = usersWithForums.map((user) => ({
      url: `${baseUrl}/user/${user.username}/forum`,
      lastModified: new Date(user.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    // Generate category and search pages
    const browseSitemapEntries = generateBrowseSitemapEntries()
    const browsePages: MetadataRoute.Sitemap = browseSitemapEntries.map(entry => ({
      url: entry.url,
      lastModified: entry.lastModified || new Date(),
      changeFrequency: entry.changeFrequency || 'weekly',
      priority: entry.priority || 0.6
    }))

    // Combine all pages and validate/sanitize URLs
    const allPages = [...staticPages, ...browsePages, ...storyPages, ...chapterPages, ...userPages, ...tagPages, ...blogPages, ...forumPages]
    const validatedPages = validateSitemapEntries(allPages)
    return validatedPages
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return at least static pages and browse pages if API query fails
    const browseSitemapEntries = generateBrowseSitemapEntries()
    const browsePages: MetadataRoute.Sitemap = browseSitemapEntries.map(entry => ({
      url: entry.url,
      lastModified: entry.lastModified || new Date(),
      changeFrequency: entry.changeFrequency || 'weekly',
      priority: entry.priority || 0.6
    }))
    const fallbackPages = [...staticPages, ...browsePages]
    const validatedFallbackPages = validateSitemapEntries(fallbackPages)
    return validatedFallbackPages
  }
}
