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
 * Generate SEO metadata for a story page
 */
export function generateStoryMetadata(story: Story, tags: string[] = []): Metadata {
  const title = `${truncateTitle(story.title)} | FableSpace`
  const authorName = getAuthorName(story)
  const genreName = getGenreName(story)
  const coverImage = story.coverImage || '/placeholder.svg'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/story/${story.slug}`

  // Build a unique and optimized 140-160 character description
  let description = story.description ? cleanTextForDescription(story.description) : ''
  if (!description) {
    description = `Read "${story.title}" by ${authorName} on FableSpace. Immerse yourself in this ${genreName} story containing ${story.wordCount || 0} words. Explore original fiction, publish your own stories, and connect with writers.`
  }
  description = truncateDescription(description, 155)

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
      ...(story.status ? [story.status] : []),
      ...tags
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
      tags: tags || [],
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
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/story/${story.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: story.title,
    description: story.description || `A ${genreName} story by ${authorName}`,
    author: {
      '@type': 'Person',
      name: authorName,
      url: story.author && typeof story.author === 'object' && story.author.username
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/user/${story.author.username}`
        : undefined
    },
    publisher: {
      '@type': 'Organization',
      name: 'FableSpace',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
    },
    genre: genreName,
    inLanguage: story.language || 'en',
    datePublished: toISOString(story.createdAt),
    dateModified: toISOString(story.updatedAt),
    url: canonicalUrl,
    image: coverImage,
    wordCount: story.wordCount || 0,
    numberOfPages: Math.ceil((story.wordCount || 0) / 250),
    bookFormat: 'EBook',
    isAccessibleForFree: true,
    keywords: tags.join(', '),
    aggregateRating: story.likeCount && story.likeCount >= 5 ? {
      '@type': 'AggregateRating',
      ratingValue: Math.min(4.9, 3.5 + Math.log10(story.likeCount) * 0.5).toFixed(1),
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
      }
    ]
  }
}
