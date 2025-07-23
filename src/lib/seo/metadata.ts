import { Metadata } from "next"
import { Story } from "@/types/story"
import { categoryDescriptions } from "./genre-descriptions"

// A simplified Blog type based on usage in the page.tsx
export interface Blog {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  featuredImage?: string | null;
  category: string;
  status: "published" | "draft";
  publishDate?: Date | null;
}

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
export function generateStoryMetadata(story: Story, tags: string[] = []): Metadata {
  const title = `${story.title} - FableSpace`
  const description = story.description
    ? story.description.slice(0, 160) + (story.description.length > 160 ? '...' : '')
    : `Read "${story.title}" by ${getAuthorName(story)} on FableSpace. A ${getGenreName(story)} story with ${story.wordCount || 0} words.`

  const authorName = getAuthorName(story)
  const genreName = getGenreName(story)
  const coverImage = story.coverImage || '/placeholder.svg'
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/story/${story.slug}`

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
 * Generate SEO metadata for a blog post
 */
export function generateBlogMetadata(blog: Blog): Metadata {
  const title = `${blog.title} - FableSpace Blog`;
  const description = blog.excerpt;
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/blog/${blog.slug}`;
  const imageUrl = blog.featuredImage || `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/og-image.jpg`;

  return {
    title,
    description,
    keywords: blog.tags.join(', '),
    authors: [{ name: 'FableSpace' }],
    creator: 'FableSpace',
    publisher: 'FableSpace',
    category: blog.category,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'FableSpace',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
      publishedTime: toISOString(blog.publishDate ?? undefined),
      authors: ['FableSpace'],
      section: blog.category,
      tags: blog.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      site: '@FableSpace',
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
  };
}

/**
 * Generate structured data (JSON-LD) for a blog post
 */
export function generateBlogStructuredData(blog: Blog) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space';
  const canonicalUrl = `${baseUrl}/blog/${blog.slug}`;
  const imageUrl = blog.featuredImage || `${baseUrl}/og-image.jpg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    name: blog.title,
    description: blog.excerpt,
    image: imageUrl,
    author: {
      '@type': 'Organization',
      name: 'FableSpace',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'FableSpace',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: toISOString(blog.publishDate ?? undefined),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    keywords: blog.tags.join(', '),
    articleSection: blog.category,
  };
}

/**
 * Generate breadcrumb structured data for a blog post page
 */
export function generateBlogBreadcrumbStructuredData(blog: Blog) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${baseUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: blog.category,
        item: `${baseUrl}/blog/category/${blog.category.toLowerCase()}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: blog.title,
        item: `${baseUrl}/blog/${blog.slug}`,
      },
    ],
  };
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
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/story/${story.slug}/chapter/${chapterNumber}`

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

/**
 * Generate SEO metadata for homepage
 */
export function generateHomepageMetadata(): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'

  return {
    title: "FableSpace - Unleash Your Stories",
    description: "Unleash your imagination on FableSpace. Publish original stories, explore fantasy, romance, and more. Connect with readers and writers in a growing creative community—no fees, no limits.",
    keywords: [
      'fiction writing',
      'story sharing',
      'creative writing',
      'online stories',
      'fantasy',
      'romance',
      'science fiction',
      'writing community',
      'publish stories',
      'read stories',
      'FableSpace'
    ].join(', '),
    authors: [{ name: 'FableSpace Team' }],
    creator: 'FableSpace',
    publisher: 'FableSpace',
    alternates: {
      canonical: baseUrl
    },
    openGraph: {
      title: "FableSpace - Unleash Your Stories",
      description: "Unleash your imagination on FableSpace. Publish original stories, explore fantasy, romance, and more. Connect with readers and writers in a growing creative community—no fees, no limits.",
      type: 'website',
      url: baseUrl,
      siteName: 'FableSpace',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: 'FableSpace - Creative Fiction Platform',
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: "FableSpace - Unleash Your Stories",
      description: "Unleash your imagination on FableSpace. Publish original stories, explore fantasy, romance, and more. Connect with readers and writers in a growing creative community—no fees, no limits.",
      images: [`${baseUrl}/og-image.jpg`],
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
 * Generate structured data for homepage
 */
export function generateHomepageStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FableSpace',
    description: 'Creative fiction-sharing platform where writers publish original stories and readers explore immersive worlds.',
    url: baseUrl,
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
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/browse?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    sameAs: [
      'https://discord.gg/JVMr2TRXY7'
    ]
  }
}

/**
 * Generate organization structured data
 */
export function generateOrganizationStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}#organization`,
    name: 'FableSpace',
    alternateName: 'FableSpace Fiction Platform',
    description: 'A cozy corner of the internet for storytellers, dreamers, and readers alike. FableSpace is a creative fiction-sharing platform where writers publish original stories, earn money through direct KoFi/Buy Me a Coffee donations, and readers explore immersive worlds—all with zero platform fees.',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 200,
      height: 200,
      caption: 'FableSpace Logo'
    },
    foundingDate: '2024',
    sameAs: [
      'https://discord.gg/JVMr2TRXY7',
      'https://twitter.com/FableSpace_',
      'https://www.linkedin.com/company/fablespace',
      'https://www.medium.com/@fablespace',
      'https://www.instagram.com/fable.space_/'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${baseUrl}/contact`,
      availableLanguage: ['English']
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressLocality: 'Surat',
      addressRegion: 'Gujarat',
    },
    knowsAbout: [
      'Creative Writing',
      'Fiction',
      'Storytelling',
      'Digital Publishing',
      'Online Literature',
      'Fantasy',
      'Romance',
      'Science Fiction',
      'Writing Community'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'Writers and Readers',
      name: 'Fiction Writers and Readers'
    },
    serviceType: 'Creative Writing Platform',
    applicationCategory: 'Entertainment',
    operatingSystem: 'Web-based',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free platform for publishing and reading fiction stories with direct KoFi/Buy Me a Coffee monetization for authors'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Writer Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Story Publishing',
            description: 'Publish fiction stories with zero platform fees'
          },
          price: '0',
          priceCurrency: 'USD'
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'KoFi/Buy Me a Coffee Monetization',
            description: 'Receive direct donations from readers with 100% earnings retention'
          },
          price: '0',
          priceCurrency: 'USD'
        }
      ]
    }
  }
}

/**
 * Generate SEO metadata for about page
 */
export function generateAboutMetadata(): Metadata {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'https://fablespace.space'
  const canonicalUrl = `${baseUrl}/about`

  const title = 'About Us - FableSpace'
  const description =
    'At FableSpace, storytellers keep 100% of reader donations and, soon, a share of ad revenue too. Learn about our mission to empower creators, reward original storytelling, and build a thriving writing community.'

  const keywords = [
    'FableSpace about',
    'fiction writing platform',
    'writers earn money',
    'reader donations',
    'no platform fees',
    'ad revenue sharing',
    'creative community',
    'online storytelling',
    'writer monetization',
    'digital publishing',
    'story platform',
    'novel writers',
    'flash fiction',
    'creative writers',
    'writing website',
    'support indie authors',
    'best writing platforms'
  ].join(', ')

  return {
    title,
    description,
    keywords,
    authors: [{ name: 'FableSpace Team' }],
    creator: 'FableSpace',
    publisher: 'FableSpace',
    alternates: { canonical: canonicalUrl },

    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'FableSpace',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-about.jpg`,
          width: 1200,
          height: 630,
          alt: 'About FableSpace – Fair Pay for Fiction Writers'
        }
      ]
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-about.jpg`],
      site: '@FableSpace'
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1
      }
    }
  }
}



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
    const genreInfo = categoryDescriptions[params.genre]
    const genreLower = params.genre.toLowerCase()

    title = `${params.genre} Stories - FableSpace`
    description = genreInfo?.description ||
      `Discover the best ${genreLower} stories on FableSpace. Read engaging ${genreLower} fiction from talented writers around the world.`

    canonicalUrl = `${baseUrl}/browse?genre=${encodeURIComponent(params.genre)}`

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
      title = `${params.status === 'completed' ? 'Completed' : 'Ongoing'} ${params.genre} Stories - FableSpace`
      description = `Find ${params.status} ${genreLower} stories on FableSpace. ${genreInfo?.description || `Browse ${genreLower} fiction that is ${params.status}.`}`
      keywords.push(`${params.status} ${genreLower}`, `${params.status} stories`)
    }
  }

  if (params?.tag) {
    const tag = params.tag
    const tagDisplay = tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    title = `${tagDisplay} Stories - FableSpace`
    description = `Discover the best ${tagDisplay.toLowerCase()} stories on FableSpace. Read engaging ${tagDisplay.toLowerCase()} fiction from talented writers around the world.`
    canonicalUrl = `${baseUrl}/browse?tag=${encodeURIComponent(tag)}`
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
      description = `Find ${params.status} ${tagDisplay.toLowerCase()} stories on FableSpace. Browse ${tagDisplay.toLowerCase()} fiction that is ${params.status}.`
      keywords.push(`${params.status} ${tagDisplay.toLowerCase()}`, `${params.status} stories`)
    }
  }

  // Enhanced search-based SEO
  if (params?.search) {
    const searchTerm = params.search.trim()
    title = `"${searchTerm}" Stories - Search Results - FableSpace`
    description = `Search results for "${searchTerm}" on FableSpace. Find stories, authors, and content matching "${searchTerm}".`
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
          url: params?.genre ? `${baseUrl}/og-${params.genre.toLowerCase().replace(/\s+/g, '-')}.jpg` : `${baseUrl}/og-browse.jpg`,
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
      images: [params?.genre ? `${baseUrl}/og-${params.genre.toLowerCase().replace(/\s+/g, '-')}.jpg` : `${baseUrl}/og-browse.jpg`],
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
  const isTag = !!params?.tag
  const isGenre = !!params?.genre && !isTag
  const genreInfo = isGenre ? categoryDescriptions[params.genre!] : null
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
          genre: typeof story.genre === 'object'
            ? (story.genre?.name || 'General')
            : (story.genre || 'General'),
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
            numberOfPages: Math.ceil(story.wordCount / 250) // Approximate pages
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

/**
 * Generate SEO metadata for user profile page
 */
export function generateUserProfileMetadata(user: {
  username: string
  name?: string | null
  bio?: string | null
  storyCount?: number
  image?: string | null
  location?: string | null
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  const displayName = user.name || user.username
  const canonicalUrl = `${baseUrl}/user/${user.username}`

  const title = `${displayName} - FableSpace`
  const description = user.bio
    ? user.bio.slice(0, 160) + (user.bio.length > 160 ? '...' : '')
    : `Read stories by ${displayName} on FableSpace. ${user.storyCount || 0} published stories. Join our creative writing community.`

  const keywords = [
    displayName,
    user.username,
    'author profile',
    'fiction writer',
    'stories',
    'creative writing',
    'FableSpace',
    ...(user.location ? [user.location] : [])
  ].filter(Boolean).join(', ')

  return {
    title,
    description,
    keywords,
    authors: [{ name: displayName }],
    creator: displayName,
    publisher: 'FableSpace',
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: canonicalUrl,
      siteName: 'FableSpace',
      images: [
        {
          url: user.image || `${baseUrl}/default-avatar.png`,
          width: 400,
          height: 400,
          alt: `${displayName} profile picture`,
        }
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [user.image || `${baseUrl}/default-avatar.png`],
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
 * Generate structured data for user profile page
 */
export function generateUserProfileStructuredData(user: {
  username: string
  name?: string | null
  bio?: string | null
  storyCount?: number
  image?: string | null
  location?: string | null
  website?: string | null
  joinedDate?: string | null
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  const displayName = user.name || user.username

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: displayName,
    alternateName: user.username,
    description: user.bio || `Fiction writer on FableSpace with ${user.storyCount || 0} published stories.`,
    url: `${baseUrl}/user/${user.username}`,
    image: user.image || `${baseUrl}/default-avatar.png`,
    ...(user.location && { address: user.location }),
    ...(user.website && { url: user.website }),
    worksFor: {
      '@type': 'Organization',
      name: 'FableSpace',
      url: baseUrl
    },
    knowsAbout: [
      'Creative Writing',
      'Fiction',
      'Storytelling'
    ],
    ...(user.joinedDate && {
      memberOf: {
        '@type': 'Organization',
        name: 'FableSpace',
        url: baseUrl,
        membershipNumber: user.username
      }
    }),
    mainEntityOfPage: {
      '@type': 'ProfilePage',
      '@id': `${baseUrl}/user/${user.username}`
    }
  }
}
