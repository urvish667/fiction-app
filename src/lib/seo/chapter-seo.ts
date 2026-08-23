import { Metadata } from "next"
import { Story } from "@/types/story"
import {
  truncateTitle,
  toISOString,
  getAuthorName,
  getAuthorUsername,
  getGenreName,
  cleanTextForDescription,
  truncateDescription,
} from "./seo-utils"

/**
 * Generate chapter metadata for SEO.
 */
export function generateChapterMetadata(story: Story, chapter: any, chapterNumber: number): Metadata {
  const chapterRaw = `${chapter.title} - Ch. ${chapterNumber} - ${story.title}`
  const title = `${truncateTitle(chapterRaw)} | FableSpace`

  const authorName = getAuthorName(story)
  const genreName = getGenreName(story)
  const coverImage = story.coverImage || '/placeholder.svg'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/story/${story.slug}/chapter/${chapterNumber}`

  // Build high-quality description
  const cleanContent = cleanTextForDescription(chapter.content || '')
  let description = cleanContent
  if (cleanContent.length < 140) {
    const defaultFallback = `Continue reading Chapter ${chapterNumber} of "${story.title}", a ${genreName} novel by ${authorName}. Read online on FableSpace.`
    description = cleanContent 
      ? `${cleanContent} | ${defaultFallback}`
      : defaultFallback
  }
  description = truncateDescription(description, 155)

  // Quality-based indexing: index published chapters with at least 50 chars of meaningful content
  const shouldIndex = chapter.status === 'published' && cleanContent.length >= 50

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
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
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
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/story/${story.slug}/chapter/${chapterNumber}`
  const storyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/story/${story.slug}`

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
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/user/${story.author.username}`
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
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'

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
