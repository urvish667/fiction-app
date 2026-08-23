import { Metadata } from "next"
import {
  toISOString,
  cleanTextForDescription,
  truncateDescription,
} from "./seo-utils"

export interface Blog {
  slug: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  featuredImage?: string | null
  category: string
  status: "published" | "draft"
  publishDate?: Date | null
  updatedAt?: Date | string | null
}

/**
 * Generate SEO metadata for a blog post
 */
export function generateBlogMetadata(blog: Blog): Metadata {
  const title = `${blog.title} - FableSpace Blog`
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/blog/${blog.slug}`

  // Build optimized description for blog post
  let description = blog.excerpt ? cleanTextForDescription(blog.excerpt) : ''
  if (!description) {
    description = `${blog.title}. Read the latest articles, writing guides, and industry insights on the FableSpace Blog.`
  }
  description = truncateDescription(description, 155)
  const imageUrl = blog.featuredImage || `${process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'}/og-image.jpg`

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
  }
}

/**
 * Generate structured data (JSON-LD) for a blog post
 */
export function generateBlogStructuredData(blog: Blog) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
  const canonicalUrl = `${baseUrl}/blog/${blog.slug}`
  const imageUrl = blog.featuredImage || `${baseUrl}/og-image.jpg`

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    name: blog.title,
    description: blog.excerpt,
    image: imageUrl,
    author: {
      '@type': 'Person',
      name: 'FableSpace Team',
      url: `${baseUrl}/about`,
      jobTitle: 'Editorial Team',
      worksFor: {
        '@type': 'Organization',
        name: 'FableSpace',
        url: baseUrl,
      },
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
    dateModified: toISOString(blog.updatedAt ?? blog.publishDate ?? undefined),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    keywords: blog.tags.join(', '),
    articleSection: blog.category,
  }
}

/**
 * Generate breadcrumb structured data for a blog post page
 */
export function generateBlogBreadcrumbStructuredData(blog: Blog) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'

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
  }
}
