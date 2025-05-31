import { Metadata } from "next"
import { Story } from "@/types/story"

/**
 * Safely convert a date to ISO string, handling both Date objects and string dates
 */
function toISOString(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  if (date instanceof Date) return date.toISOString();
  if (typeof date === 'string') return date;
  return undefined;
}

/**
 * Generate SEO metadata for a story page
 */
export function generateStoryMetadata(story: Story): Metadata {
  const title = `${story.title} - FableSpace`
  const description = story.description
    ? story.description.slice(0, 160) + (story.description.length > 160 ? '...' : '')
    : `Read "${story.title}" by ${getAuthorName(story)} on FableSpace. A ${getGenreName(story)} story with ${story.wordCount || 0} words.`

  const authorName = getAuthorName(story)
  const genreName = getGenreName(story)
  const coverImage = story.coverImage || '/placeholder.svg'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'}/story/${story.slug}`

  return {
    title,
    description,
    keywords: [
      story.title,
      authorName,
      genreName,
      'fiction',
      'story',
      'reading',
      'FableSpace',
      ...(story.language ? [story.language] : []),
      ...(story.status ? [story.status] : [])
    ].filter(Boolean).join(', '),
    authors: [{ name: authorName }],
    creator: authorName,
    publisher: 'FableSpace',
    category: genreName,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'FableSpace',
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: `${story.title} cover image`,
        }
      ],
      authors: [authorName],
      publishedTime: toISOString(story.createdAt),
      modifiedTime: toISOString(story.updatedAt),
      section: genreName,
      tags: [], // Will be populated with actual tags if available
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImage],
      creator: `@${getAuthorUsername(story)}`,
      site: '@FableSpace'
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'article:author': authorName,
      'article:section': genreName,
      'article:published_time': toISOString(story.createdAt) || '',
      'article:modified_time': toISOString(story.updatedAt) || '',
      'book:author': authorName,
      'book:genre': genreName,
      'book:release_date': toISOString(story.createdAt) || '',
    }
  }
}

/**
 * Generate structured data (JSON-LD) for a story
 */
export function generateStoryStructuredData(story: Story, tags: string[] = []) {
  const authorName = getAuthorName(story)
  const genreName = getGenreName(story)
  const coverImage = story.coverImage || '/placeholder.svg'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'}/story/${story.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: story.title,
    description: story.description || `A ${genreName} story by ${authorName}`,
    author: {
      '@type': 'Person',
      name: authorName,
      url: story.author && typeof story.author === 'object' && story.author.username
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'}/user/${story.author.username}`
        : undefined
    },
    publisher: {
      '@type': 'Organization',
      name: 'FableSpace',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'
    },
    genre: genreName,
    inLanguage: story.language || 'en',
    datePublished: toISOString(story.createdAt),
    dateModified: toISOString(story.updatedAt),
    url: canonicalUrl,
    image: coverImage,
    wordCount: story.wordCount || 0,
    numberOfPages: Math.ceil((story.wordCount || 0) / 250), // Estimate pages
    bookFormat: 'EBook',
    isAccessibleForFree: true,
    keywords: tags.join(', '),
    aggregateRating: story.likeCount && story.likeCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: 4.5, // Default rating - could be calculated from actual ratings
      reviewCount: story.likeCount,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ReadAction',
        userInteractionCount: story.viewCount || story.readCount || 0
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: story.likeCount || 0
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: story.commentCount || 0
      }
    ]
  }
}

/**
 * Generate breadcrumb structured data for a story page
 */
export function generateStoryBreadcrumbStructuredData(story: Story) {
  const genreName = getGenreName(story)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Browse Stories',
        item: `${baseUrl}/browse`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: genreName,
        item: `${baseUrl}/browse?genre=${encodeURIComponent(genreName)}`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: story.title,
        item: `${baseUrl}/story/${story.slug}`
      }
    ]
  }
}

// Helper functions
function getAuthorName(story: Story): string {
  if (story.author && typeof story.author === 'object') {
    return story.author.name || story.author.username || 'Unknown Author'
  }
  return 'Unknown Author'
}

function getAuthorUsername(story: Story): string {
  if (story.author && typeof story.author === 'object') {
    return story.author.username || 'unknown'
  }
  return 'unknown'
}

function getGenreName(story: Story): string {
  if (typeof story.genre === 'object' && story.genre !== null) {
    return (story.genre as { name: string }).name
  }
  if (typeof story.genre === 'string') {
    return story.genre
  }
  return 'Fiction'
}

/**
 * Generate chapter metadata for SEO
 */
export function generateChapterMetadata(story: Story, chapter: any, chapterNumber: number): Metadata {
  const title = `${chapter.title} - Chapter ${chapterNumber} - ${story.title} - FableSpace`
  const description = chapter.content
    ? chapter.content.replace(/<[^>]*>/g, '').slice(0, 160) + (chapter.content.length > 160 ? '...' : '')
    : `Read Chapter ${chapterNumber} of "${story.title}" by ${getAuthorName(story)} on FableSpace.`

  const authorName = getAuthorName(story)
  const genreName = getGenreName(story)
  const coverImage = story.coverImage || '/placeholder.svg'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'}/story/${story.slug}/chapter/${chapterNumber}`

  return {
    title,
    description,
    keywords: [
      story.title,
      chapter.title,
      `Chapter ${chapterNumber}`,
      authorName,
      genreName,
      'fiction',
      'story',
      'reading',
      'FableSpace'
    ].filter(Boolean).join(', '),
    authors: [{ name: authorName }],
    creator: authorName,
    publisher: 'FableSpace',
    category: genreName,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'FableSpace',
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: `${story.title} cover image`,
        }
      ],
      authors: [authorName],
      publishedTime: toISOString(chapter.createdAt),
      modifiedTime: toISOString(chapter.updatedAt),
      section: genreName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImage],
      creator: `@${getAuthorUsername(story)}`,
      site: '@FableSpace'
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    }
  }
}

/**
 * Generate structured data (JSON-LD) for a chapter
 */
export function generateChapterStructuredData(story: Story, chapter: any, chapterNumber: number) {
  const authorName = getAuthorName(story)
  const genreName = getGenreName(story)
  const coverImage = story.coverImage || '/placeholder.svg'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'}/story/${story.slug}/chapter/${chapterNumber}`
  const storyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'}/story/${story.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    name: chapter.title,
    description: chapter.content
      ? chapter.content.replace(/<[^>]*>/g, '').slice(0, 160) + (chapter.content.length > 160 ? '...' : '')
      : `Chapter ${chapterNumber} of "${story.title}" by ${authorName}`,
    author: {
      '@type': 'Person',
      name: authorName,
      url: story.author && typeof story.author === 'object' && story.author.username
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'}/user/${story.author.username}`
        : undefined
    },
    isPartOf: {
      '@type': 'Book',
      name: story.title,
      author: {
        '@type': 'Person',
        name: authorName
      },
      url: storyUrl,
      genre: genreName,
      image: coverImage
    },
    publisher: {
      '@type': 'Organization',
      name: 'FableSpace',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'
    },
    position: chapterNumber,
    inLanguage: story.language || 'en',
    datePublished: toISOString(chapter.createdAt),
    dateModified: toISOString(chapter.updatedAt),
    url: canonicalUrl,
    wordCount: chapter.wordCount || 0,
    isAccessibleForFree: true,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ReadAction',
        userInteractionCount: chapter.readCount || 0
      }
    ]
  }
}

/**
 * Generate breadcrumb structured data for a chapter page
 */
export function generateChapterBreadcrumbStructuredData(story: Story, chapter: any, chapterNumber: number) {
  const genreName = getGenreName(story)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Browse Stories',
        item: `${baseUrl}/browse`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: genreName,
        item: `${baseUrl}/browse?genre=${encodeURIComponent(genreName)}`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: story.title,
        item: `${baseUrl}/story/${story.slug}`
      },
      {
        '@type': 'ListItem',
        position: 5,
        name: `Chapter ${chapterNumber}: ${chapter.title}`,
        item: `${baseUrl}/story/${story.slug}/chapter/${chapterNumber}`
      }
    ]
  }
}