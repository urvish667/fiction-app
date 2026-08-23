import { Metadata } from "next"
import { safeDecodeURIComponent } from "@/utils/safe-decode-uri-component"
import { categoryDescriptions } from "./genre-descriptions"
import { slugify } from "@/lib/utils"
import {
  toISOString,
  truncateDescription,
} from "./seo-utils"

/**
 * Generate SEO metadata for browse page with enhanced category-based optimization
 */
export function generateBrowseMetadata(params?: {
  genre?: string
  tag?: string
  search?: string
  language?: string
  status?: string
  totalStories?: number
  page?: number
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'

  let title = "Browse Stories - FableSpace"
  let description = "Discover amazing stories on FableSpace. Browse thousands of fiction stories across all genres including fantasy, romance, science fiction, and more."
  let canonicalUrl = `${baseUrl}/browse`
  let keywords = [
    'browse stories',
    'fiction stories',
    'online reading',
    'story discovery',
    'creative writing',
    'FableSpace',
    'free stories',
    'indie authors',
    'digital library'
  ]

  // Enhanced genre-based SEO
  if (params?.genre) {
    const genre = safeDecodeURIComponent(params.genre)
    if (genre) {
      // Find matching key in categoryDescriptions by comparing slugified keys
      const matchedGenreKey = Object.keys(categoryDescriptions).find(
        key => slugify(key) === genre || key.toLowerCase() === genre.toLowerCase()
      )

      const genreKey = matchedGenreKey || genre
      const genreInfo = categoryDescriptions[genreKey]
      const genreLower = genreKey.toLowerCase()
      const encodedGenre = slugify(genreKey)

      title = `${genreKey} Stories - FableSpace`
      description = genreInfo?.description ||
        `Discover the best ${genreLower} stories on FableSpace. Read engaging, original ${genreLower} fiction from talented writers in our creative writing community. Start reading for free!`
      description = truncateDescription(description, 155)

      canonicalUrl = `${baseUrl}/browse?genre=${encodedGenre}`

      keywords = [
        ...keywords,
        genreLower,
        `${genreLower} fiction`,
        `${genreLower} stories`,
        `${genreLower} books`,
        `read ${genreLower}`,
        `${genreLower} FableSpace`,
        ...(genreInfo?.keywords || [])
      ]

      // Add status-specific keywords if present
      if (params.status && params.status !== 'all') {
        title = `${params.status === 'completed' ? 'Completed' : 'Ongoing'} ${genreKey} Stories - FableSpace`
        description = `Find ${params.status} ${genreLower} stories on FableSpace. ${genreInfo?.description || `Browse original ${genreLower} fiction that is ${params.status}. Read and connect with authors for free.`}`
        description = truncateDescription(description, 155)
        keywords.push(`${params.status} ${genreLower}`, `${params.status} stories`)
      }
    }
  }

  if (params?.tag) {
    const tag = safeDecodeURIComponent(params.tag)
    let tagDisplay = ''
    if (tag) {
      tagDisplay = tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const encodedTag = encodeURIComponent(tag.replace(/\s/g, "+")).replace(/%2B/g, '+')

      title = `${tagDisplay} Stories - FableSpace`
      description = `Discover the best ${tagDisplay.toLowerCase()} stories on FableSpace. Read engaging, original ${tagDisplay.toLowerCase()} fiction from talented writers in our creative writing community. Start reading online for free!`
      description = truncateDescription(description, 155)
      canonicalUrl = `${baseUrl}/browse?tag=${encodedTag}`
    }

    keywords = [
      'browse stories',
      'fiction stories',
      'online reading',
      'story discovery',
      'creative writing',
      'FableSpace',
      'free stories',
      'indie authors',
      'digital library',
      tagDisplay.toLowerCase(),
      `${tagDisplay.toLowerCase()} fiction`,
      `${tagDisplay.toLowerCase()} stories`,
      `${tagDisplay.toLowerCase()} books`,
      `${tagDisplay.toLowerCase()} FableSpace`,
      `read ${tagDisplay.toLowerCase()}`
    ]

    // Add status-specific keywords if present
    if (params.status && params.status !== 'all') {
      title = `${params.status === 'completed' ? 'Completed' : 'Ongoing'} ${tagDisplay} Stories - FableSpace`
      description = `Find ${params.status} ${tagDisplay.toLowerCase()} stories on FableSpace. Browse original ${tagDisplay.toLowerCase()} fiction that is ${params.status}. Read and connect with authors for free.`
      description = truncateDescription(description, 155)
      keywords.push(`${params.status} ${tagDisplay.toLowerCase()}`, `${params.status} stories`)
    }
  }

  // Enhanced search-based SEO
  if (params?.search) {
    const searchTerm = params.search.trim()
    title = `"${searchTerm}" Stories - Search Results - FableSpace`
    description = `Search results for "${searchTerm}" on FableSpace. Discover fiction stories, talented writers, and creative content matching the search term "${searchTerm}".`
    description = truncateDescription(description, 155)
    canonicalUrl = `${baseUrl}/browse?search=${encodeURIComponent(searchTerm)}`
    keywords.push(searchTerm, `${searchTerm} stories`, `${searchTerm} fiction`)
  }

  // Language-specific SEO
  if (params?.language && params.language !== 'English') {
    const langSuffix = ` in ${params.language}`
    title = title.replace(' - FableSpace', `${langSuffix} - FableSpace`)
    description = description.replace('.', `${langSuffix}.`)
    keywords.push(params.language.toLowerCase(), `${params.language.toLowerCase()} stories`)
  }

  // Add story count to description if available
  if (params?.totalStories && params.totalStories > 0) {
    const storyCountText = `Browse ${params.totalStories.toLocaleString()} stories`
    description = description.replace('Discover', storyCountText + '. Discover')
  }

  return {
    title,
    description,
    keywords: keywords.filter(Boolean).join(', '),
    authors: [{ name: 'FableSpace Community' }],
    creator: 'FableSpace',
    publisher: 'FableSpace',
    category: params?.genre || 'Fiction',
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'FableSpace',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: params?.genre ? `${params.genre} Stories on FableSpace` : 'Browse Stories on FableSpace',
        }
      ],
      locale: 'en_US',
      ...(params?.genre && { section: params.genre })
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.jpg`],
      site: '@FableSpace'
    },
    robots: {
      index: !(params?.page && params.page > 1) && !(params?.language && params?.status && params.status !== 'all'),
      follow: true,
      googleBot: {
        index: !(params?.page && params.page > 1) && !(params?.language && params?.status && params.status !== 'all'),
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    }
  }
}

/**
 * Generate enhanced structured data for browse page with category or tag-specific optimization
 */
export function generateBrowseStructuredData(params?: {
  genre?: string
  tag?: string
  language?: string
  status?: string
  totalStories?: number
  stories?: any[]
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  const isTag = Boolean(params?.tag)
  const isGenre = Boolean(params?.genre) && !isTag
  const genreInfo = isGenre ? categoryDescriptions[params!.genre!] : null
  const tag = params?.tag
  const tagDisplay = tag ? tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : undefined

  // Base structured data
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: isTag
      ? `${tagDisplay} Stories`
      : isGenre
        ? `${params?.genre} Stories`
        : 'Browse Stories',
    description: isTag
      ? `Collection of ${tagDisplay?.toLowerCase()} stories on FableSpace`
      : genreInfo?.description ||
      (isGenre
        ? `Collection of ${params?.genre?.toLowerCase()} stories on FableSpace`
        : 'Browse and discover amazing fiction stories on FableSpace'),
    url: isTag
      ? `${baseUrl}/browse?tag=${encodeURIComponent(tag!)}`
      : isGenre
        ? `${baseUrl}/browse?genre=${encodeURIComponent(params?.genre!)}`
        : `${baseUrl}/browse`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'FableSpace',
      url: baseUrl
    },
    publisher: {
      '@type': 'Organization',
      name: 'FableSpace',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
        width: 200,
        height: 200
      }
    },
    breadcrumb: {
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
        ...(isGenre
          ? [{
            '@type': 'ListItem',
            position: 3,
            name: params?.genre,
            item: `${baseUrl}/browse?genre=${encodeURIComponent(params?.genre!)}`
          }]
          : []),
        ...(isTag
          ? [{
            '@type': 'ListItem',
            position: 3,
            name: tagDisplay,
            item: `${baseUrl}/browse?tag=${encodeURIComponent(tag!)}`
          }]
          : [])
      ]
    }
  }

  // Add story count if available
  if (params?.totalStories && params.totalStories > 0) {
    structuredData.numberOfItems = params.totalStories
  }

  // Add genre-specific keywords
  if (isGenre && genreInfo?.keywords) {
    structuredData.keywords = genreInfo.keywords.join(', ')
  }

  // Add language information
  if (params?.language) {
    structuredData.inLanguage = params.language
  }

  // Add ItemList for stories if provided
  if (params?.stories && params.stories.length > 0) {
    structuredData.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: params.stories.length,
      itemListElement: params.stories.slice(0, 10).map((story, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Book',
          name: story.title,
          author: {
            '@type': 'Person',
            name: typeof story.author === 'object'
              ? (story.author?.name || story.author?.username || 'Unknown Author')
              : (story.author || 'Unknown Author')
          },
          genre: story.genre?.name ?? 'General',
          url: `${baseUrl}/story/${story.slug}`,
          ...(story.coverImage && {
            image: {
              '@type': 'ImageObject',
              url: story.coverImage,
              width: 400,
              height: 600
            }
          }),
          ...(story.description && {
            description: story.description.slice(0, 160) + (story.description.length > 160 ? '...' : '')
          }),
          ...(story.wordCount && {
            numberOfPages: Math.ceil(story.wordCount / 250)
          }),
          ...(story.createdAt && {
            datePublished: toISOString(story.createdAt)
          }),
          ...(story.updatedAt && {
            dateModified: toISOString(story.updatedAt)
          })
        }
      }))
    }
  }

  return structuredData
}

/**
 * Generate FAQ structured data for category pages
 */
export function generateCategoryFAQStructuredData(genre: string) {
  const commonFAQs = [
    {
      question: `What are the best ${genre.toLowerCase()} stories on FableSpace?`,
      answer: `FableSpace features a curated collection of ${genre.toLowerCase()} stories from talented indie authors. Browse our ${genre.toLowerCase()} section to discover highly-rated stories, trending reads, and hidden gems in the ${genre.toLowerCase()} genre.`
    },
    {
      question: `How do I find new ${genre.toLowerCase()} stories to read?`,
      answer: `You can discover new ${genre.toLowerCase()} stories by browsing our ${genre.toLowerCase()} category, using our advanced filters to sort by popularity, newest releases, or completed stories. You can also follow your favorite ${genre.toLowerCase()} authors to get notified of their new releases.`
    },
    {
      question: `Are ${genre.toLowerCase()} stories on FableSpace free to read?`,
      answer: `Yes! Most ${genre.toLowerCase()} stories on FableSpace are free to read. Our platform supports authors through optional reader donations, allowing you to enjoy great ${genre.toLowerCase()} fiction while supporting the writers you love.`
    },
    {
      question: `Can I publish my own ${genre.toLowerCase()} stories on FableSpace?`,
      answer: `Absolutely! FableSpace welcomes ${genre.toLowerCase()} writers of all experience levels. You can publish your ${genre.toLowerCase()} stories, build an audience, and even earn money through reader donations with no platform fees.`
    }
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: commonFAQs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

/**
 * Generate WebPage structured data for category pages
 */
export function generateCategoryWebPageStructuredData(params: {
  genre: string
  totalStories?: number
  language?: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  const genreInfo = categoryDescriptions[params.genre]

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${params.genre} Stories - FableSpace`,
    description: genreInfo?.description || `Discover amazing ${params.genre.toLowerCase()} stories on FableSpace`,
    url: `${baseUrl}/browse?genre=${encodeURIComponent(params.genre)}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'FableSpace',
      url: baseUrl
    },
    about: {
      '@type': 'Thing',
      name: `${params.genre} Fiction`,
      description: `${params.genre} stories and literature`
    },
    audience: {
      '@type': 'Audience',
      audienceType: `${params.genre} readers`
    },
    ...(params.totalStories && {
      mainContentOfPage: {
        '@type': 'WebPageElement',
        description: `Collection of ${params.totalStories} ${params.genre.toLowerCase()} stories`
      }
    }),
    ...(params.language && {
      inLanguage: params.language
    }),
    publisher: {
      '@type': 'Organization',
      name: 'FableSpace',
      url: baseUrl
    }
  }
}
