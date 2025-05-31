// Test file to verify SEO metadata generation
import { generateStoryMetadata, generateStoryStructuredData, generateStoryBreadcrumbStructuredData } from './metadata'

// Mock story data for testing
const mockStory = {
  id: '1',
  title: 'The Chronicles of Eldoria',
  slug: 'chronicles-of-eldoria',
  description: 'An epic fantasy adventure following a young mage as she discovers her true powers and battles ancient evils threatening her world.',
  coverImage: 'https://example.com/cover.jpg',
  author: {
    id: 'author1',
    name: 'Jane Smith',
    username: 'janesmith',
    donationsEnabled: true,
    donationMethod: 'paypal',
    donationLink: 'https://paypal.me/janesmith'
  },
  genre: {
    name: 'Fantasy'
  },
  language: 'en',
  status: 'ongoing',
  wordCount: 75000,
  likeCount: 245,
  viewCount: 1500,
  commentCount: 89,
  readCount: 1200,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-20'),
  isMature: false,
  isLiked: false,
  isBookmarked: false
}

const mockTags = ['fantasy', 'magic', 'adventure', 'young adult']

// Test metadata generation
export function testSEOGeneration() {
  console.log('Testing SEO Metadata Generation...')
  
  // Test story metadata
  const metadata = generateStoryMetadata(mockStory as any)
  console.log('Generated Metadata:', {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    openGraph: metadata.openGraph,
    twitter: metadata.twitter
  })
  
  // Test structured data
  const structuredData = generateStoryStructuredData(mockStory as any, mockTags)
  console.log('Generated Structured Data:', structuredData)
  
  // Test breadcrumb data
  const breadcrumbData = generateStoryBreadcrumbStructuredData(mockStory as any)
  console.log('Generated Breadcrumb Data:', breadcrumbData)
  
  return {
    metadata,
    structuredData,
    breadcrumbData
  }
}

// Example of what the generated metadata looks like
export const exampleOutput = {
  metadata: {
    title: 'The Chronicles of Eldoria - FableSpace',
    description: 'An epic fantasy adventure following a young mage as she discovers her true powers and battles ancient evils threatening her world.',
    keywords: 'The Chronicles of Eldoria, Jane Smith, Fantasy, fiction, story, reading, FableSpace, en, ongoing',
    openGraph: {
      title: 'The Chronicles of Eldoria - FableSpace',
      description: 'An epic fantasy adventure following a young mage...',
      type: 'article',
      url: 'https://fablespace.com/story/chronicles-of-eldoria',
      siteName: 'FableSpace',
      images: [
        {
          url: 'https://example.com/cover.jpg',
          width: 1200,
          height: 630,
          alt: 'The Chronicles of Eldoria cover image'
        }
      ],
      authors: ['Jane Smith']
    },
    twitter: {
      card: 'summary_large_image',
      title: 'The Chronicles of Eldoria - FableSpace',
      description: 'An epic fantasy adventure following a young mage...',
      images: ['https://example.com/cover.jpg'],
      creator: '@janesmith',
      site: '@FableSpace'
    }
  },
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: 'The Chronicles of Eldoria',
    description: 'An epic fantasy adventure following a young mage...',
    author: {
      '@type': 'Person',
      name: 'Jane Smith',
      url: 'https://fablespace.com/user/janesmith'
    },
    publisher: {
      '@type': 'Organization',
      name: 'FableSpace',
      url: 'https://fablespace.com'
    },
    genre: 'Fantasy',
    wordCount: 75000,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.5,
      reviewCount: 245
    },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ReadAction',
        userInteractionCount: 1200
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction', 
        userInteractionCount: 245
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: 89
      }
    ]
  }
}
