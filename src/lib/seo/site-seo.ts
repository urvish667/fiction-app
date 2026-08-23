import { Metadata } from "next"
import { toISOString } from "./seo-utils"

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
    dateModified: new Date().toISOString(),
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
 * Generate FAQPage structured data for homepage GEO optimization.
 */
export function generateHomepageFAQStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is FableSpace?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'FableSpace is a free creative fiction platform where independent writers publish original stories and readers discover immersive worlds across genres like fantasy, romance, science fiction, mystery, and more. It is completely free to use for both writers and readers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I publish stories for free on FableSpace?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Publishing on FableSpace is 100% free. Writers can create an account, write chapter-by-chapter, and publish their stories at no cost. There are no subscription fees, listing fees, or publishing fees.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do writers keep all of their earnings on FableSpace?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Writers keep 100% of reader donations on FableSpace. Readers can support their favorite authors directly through Buy Me a Coffee or Ko-fi. FableSpace takes no cut from these donations.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is FableSpace free to read?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. All stories on FableSpace are completely free to read. There are no paywalls, no premium tiers, and no subscription required to access any story or chapter.',
        },
      },
      {
        '@type': 'Question',
        name: 'What genres are available on FableSpace?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'FableSpace supports 25+ fiction genres including Fantasy, Romance, Science Fiction, Mystery, Thriller, Horror, Historical, Adventure, Young Adult, Drama, Poetry, LGBTQ+, Fanfiction, Dystopian, Paranormal, and many more.',
        },
      },
    ],
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
          url: `${baseUrl}/og-image.jpg`,
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
      images: [`${baseUrl}/og-image.jpg`],
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

/**
 * Generate SEO metadata for forum page
 */
export function generateForumMetadata(user: {
  username: string
  name?: string | null
  image?: string | null
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  const displayName = user.name || user.username
  const canonicalUrl = `${baseUrl}/user/${user.username}/forum`

  const title = `${user.username}'s Forum - FableSpace`
  const description = `Join the discussion in ${displayName}'s author forum. FableSpace author forum, ${user.username} forum, ${user.username} community. Connect with ${displayName} and other readers.`

  return {
    title,
    description,
    keywords: [
      user.username,
      `${user.username} forum`,
      `${user.username} community`,
      'FableSpace author forum',
      '@user forum',
      '@user community',
      displayName,
      'author forum',
      'writing community',
      'fiction discussion',
      'FableSpace'
    ].filter(Boolean).join(', '),
    authors: [{ name: displayName }],
    creator: displayName,
    publisher: 'FableSpace',
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
 * Generate SEO metadata for forum post page
 */
export function generateForumPostMetadata(post: {
  title: string
  content: string
  slug: string
  createdAt: Date
  author: {
    username: string
    name?: string | null
  }
}, forumOwner: {
  username: string
  name?: string | null
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  const forumOwnerDisplayName = forumOwner.name || forumOwner.username
  const postAuthorDisplayName = post.author.name || post.author.username
  const canonicalUrl = `${baseUrl}/user/${forumOwner.username}/forum/comment/${post.slug}`

  const title = `${post.title} - ${forumOwnerDisplayName}'s Forum - FableSpace`
  const description = post.content.replace(/<[^>]*>/g, '').slice(0, 160) + (post.content.length > 160 ? '...' : '')

  return {
    title,
    description,
    keywords: [
      post.title,
      `${forumOwner.username} forum`,
      `${forumOwner.username} community`,
      `forum post`,
      `forum discussion`,
      post.author.username,
      postAuthorDisplayName,
      forumOwner.username,
      forumOwnerDisplayName,
      'FableSpace author forum',
      '@user forum',
      '@user community',
      'fiction discussion',
      'writing community',
      'FableSpace'
    ].filter(Boolean).join(', '),
    authors: [{ name: postAuthorDisplayName }],
    creator: postAuthorDisplayName,
    publisher: 'FableSpace',
    category: 'Forum Discussion',
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'FableSpace',
      publishedTime: toISOString(post.createdAt),
      authors: [postAuthorDisplayName],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
 * Generate structured data for forum page
 */
export function generateForumStructuredData(user: {
  username: string
  name?: string | null
  image?: string | null
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  const displayName = user.name || user.username

  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    name: `${displayName}'s Forum`,
    description: `Join the discussion in ${displayName}'s author forum on FableSpace.`,
    url: `${baseUrl}/user/${user.username}/forum`,
    author: {
      '@type': 'Person',
      name: displayName,
      alternateName: user.username,
      url: `${baseUrl}/user/${user.username}`,
      image: user.image || `${baseUrl}/default-avatar.png`
    },
    publisher: {
      '@type': 'Organization',
      name: 'FableSpace',
      url: baseUrl
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'FableSpace',
      url: baseUrl
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/user/${user.username}/forum`
    }
  }
}

/**
 * Generate structured data for forum post
 */
export function generateForumPostStructuredData(post: {
  title: string
  content: string
  slug: string
  createdAt: Date
  author: {
    username: string
    name?: string | null
  }
}, forumOwner: {
  username: string
  name?: string | null
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  const forumOwnerDisplayName = forumOwner.name || forumOwner.username
  const postAuthorDisplayName = post.author.name || post.author.username

  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: post.title,
    name: post.title,
    description: post.content.replace(/<[^>]*>/g, '').slice(0, 160) + (post.content.length > 160 ? '...' : ''),
    author: {
      '@type': 'Person',
      name: postAuthorDisplayName,
      url: `${baseUrl}/user/${post.author.username}`
    },
    publisher: {
      '@type': 'Organization',
      name: 'FableSpace',
      url: baseUrl
    },
    datePublished: toISOString(post.createdAt),
    url: `${baseUrl}/user/${forumOwner.username}/forum/comment/${post.slug}`,
    isPartOf: {
      '@type': 'DiscussionForumPosting',
      name: `${forumOwnerDisplayName}'s Forum`,
      url: `${baseUrl}/user/${forumOwner.username}/forum`
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/user/${forumOwner.username}/forum/comment/${post.slug}`
    }
  }
}

/**
 * Generate breadcrumb structured data for forum page
 */
export function generateForumBreadcrumbStructuredData(user: {
  username: string
  name?: string | null
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  const displayName = user.name || user.username

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
        name: displayName,
        item: `${baseUrl}/user/${user.username}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Forum',
        item: `${baseUrl}/user/${user.username}/forum`
      }
    ]
  }
}

/**
 * Generate breadcrumb structured data for forum post page
 */
export function generateForumPostBreadcrumbStructuredData(post: {
  title: string
  slug: string
}, forumOwner: {
  username: string
  name?: string | null
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  const displayName = forumOwner.name || forumOwner.username

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
        name: displayName,
        item: `${baseUrl}/user/${forumOwner.username}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Forum',
        item: `${baseUrl}/user/${forumOwner.username}/forum`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: post.title,
        item: `${baseUrl}/user/${forumOwner.username}/forum/comment/${post.slug}`
      }
    ]
  }
}
