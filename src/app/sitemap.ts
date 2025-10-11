import { MetadataRoute } from 'next'
import { prisma } from '@/lib/auth/db-adapter'
import { generateBrowseSitemapEntries, validateSitemapEntries } from '@/lib/seo/sitemap-utils'

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

    // Tags
    const pageSize = 1000
    let page = 0
    let tagPages: MetadataRoute.Sitemap = []

    while (true) {
      const tags = await prisma.tag.findMany({
        skip: page * pageSize,
        take: pageSize,
        select: { slug: true },
      })

      if (tags.length === 0) break

      const entries = tags.map(tag => ({
        url: `${baseUrl}/browse?tag=${encodeURIComponent(tag.slug)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))

      tagPages = tagPages.concat(entries)
      page++
    }

    // Get blogs
    const blogs = await prisma.blog.findMany({
      where: { status: 'published' }, // Adjust if needed
      select: {
        slug: true,
        updatedAt: true
      } 
    })

    // Generate blog pages
    const blogPages: MetadataRoute.Sitemap = blogs.map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: blog.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

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

    // Get users with enabled forums (author forums only)
    const usersWithForums = await prisma.user.findMany({
      where: {
        username: {
          not: null,
        },
        forums: {
          some: {
            type: 'AUTHOR'
          }
        }
      },
      select: {
        username: true,
        updatedAt: true,
        preferences: true,
      },
    })

    // Filter users with forum enabled in preferences and generate forum pages
    const forumPages: MetadataRoute.Sitemap = usersWithForums
      .filter((user) => {
        if (!user.username) return false

        // Parse preferences to check if forum is enabled
        try {
          const preferences = typeof user.preferences === 'string'
            ? JSON.parse(user.preferences)
            : user.preferences
          return preferences?.privacySettings?.forum === true
        } catch {
          return false // Default to disabled if preferences can't be parsed
        }
      })
      .map((user) => ({
        url: `${baseUrl}/user/${user.username}/forum`,
        lastModified: user.updatedAt,
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
