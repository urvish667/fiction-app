import { MetadataRoute } from 'next'
import { prisma } from '@/lib/auth/db-adapter'
import { generateBrowseSitemapEntries, validateSitemapEntries } from '@/lib/seo/sitemap-utils'

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
    // Get all published stories (ongoing and completed)
    const stories = await prisma.story.findMany({
      where: {
        status: {
          in: ['ongoing', 'completed'],
        },
      },
      select: {
        slug: true,
        updatedAt: true,
        createdAt: true,
        chapters: {
          where: {
            status: 'published',
          },
          select: {
            number: true,
            updatedAt: true,
          },
          orderBy: {
            number: 'asc',
          },
        },
      },
    })

    // Generate story pages
    const storyPages: MetadataRoute.Sitemap = stories.map((story) => ({
      url: `${baseUrl}/story/${story.slug}`,
      lastModified: story.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Generate chapter pages
    const chapterPages: MetadataRoute.Sitemap = stories.flatMap((story) =>
      story.chapters.map((chapter) => ({
        url: `${baseUrl}/story/${story.slug}/chapter/${chapter.number}`,
        lastModified: chapter.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))
    )

    // Get all users with public profiles
    const users = await prisma.user.findMany({
      where: {
        username: {
          not: null,
        },
      },
      select: {
        username: true,
        updatedAt: true,
        preferences: true,
      },
    })

    // Filter users with public profiles and generate user profile pages
    const userPages: MetadataRoute.Sitemap = users
      .filter((user) => {
        if (!user.username) return false

        // Parse preferences to check if profile is public
        try {
          const preferences = typeof user.preferences === 'string'
            ? JSON.parse(user.preferences)
            : user.preferences
          return preferences?.privacySettings?.publicProfile === true
        } catch {
          return false // Default to private if preferences can't be parsed
        }
      })
      .map((user) => ({
        url: `${baseUrl}/user/${user.username}`,
        lastModified: user.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
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
    const allPages = [...staticPages, ...browsePages, ...storyPages, ...chapterPages, ...userPages]
    const validatedPages = validateSitemapEntries(allPages)
    return validatedPages
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return at least static pages and browse pages if database query fails
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
