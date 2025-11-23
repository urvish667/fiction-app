import { Metadata } from "next"

/**
 * Generate SEO metadata for contact page
 */
export function generateContactMetadata(): Metadata {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
    const canonicalUrl = `${baseUrl}/contact`

    const title = 'Contact Us - FableSpace'
    const description =
        'Get in touch with the FableSpace team. We\'re here to help with questions, feedback, partnerships, or support. Reach out to us and we\'ll respond as soon as possible.'

    return {
        title,
        description,
        keywords: 'contact FableSpace, FableSpace support, get in touch, customer service, help desk, feedback, partnerships, writing platform support, FableSpace team',
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
                    alt: 'Contact FableSpace'
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
 * Generate SEO metadata for privacy policy page
 */
export function generatePrivacyMetadata(): Metadata {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
    const canonicalUrl = `${baseUrl}/privacy`

    const title = 'Privacy Policy - FableSpace'
    const description =
        'Read FableSpace\'s privacy policy to understand how we collect, use, and protect your personal information. We are committed to protecting your privacy and data security.'

    return {
        title,
        description,
        keywords: 'FableSpace privacy policy, data protection, privacy, user data, GDPR, data security, personal information, cookies policy',
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
                    alt: 'FableSpace Privacy Policy'
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
 * Generate SEO metadata for terms of service page
 */
export function generateTermsMetadata(): Metadata {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
    const canonicalUrl = `${baseUrl}/terms`

    const title = 'Terms of Service - FableSpace'
    const description =
        'Read FableSpace\'s terms of service to understand the rules and guidelines for using our platform. Learn about user rights, content ownership, and community standards.'

    return {
        title,
        description,
        keywords: 'FableSpace terms of service, terms and conditions, user agreement, platform rules, content ownership, community guidelines, legal terms',
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
                    alt: 'FableSpace Terms of Service'
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
 * Generate SEO metadata for challenges page
 */
export function generateChallengesMetadata(): Metadata {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
    const canonicalUrl = `${baseUrl}/challenges`

    const title = 'Writing Challenges - FableSpace'
    const description =
        'Participate in creative writing challenges on FableSpace. Join themed contests, improve your writing skills, and connect with other writers. New challenges every month!'

    return {
        title,
        description,
        keywords: 'writing challenges, creative writing contests, FableSpace challenges, writing prompts, fiction contests, writing competition, monthly challenges, writer community, improve writing skills',
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
                    alt: 'FableSpace Writing Challenges'
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
 * Generate SEO metadata for library page (user-specific, not indexed)
 */
export function generateLibraryMetadata(): Metadata {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
    const canonicalUrl = `${baseUrl}/library`

    const title = 'My Library - FableSpace'
    const description =
        'Access your personal library on FableSpace. View your bookmarked stories, reading history, and favorite fiction all in one place. Organize and manage your reading list.'

    return {
        title,
        description,
        keywords: 'reading library, bookmarked stories, reading list, saved stories, FableSpace library, my books, reading history, favorites',
        authors: [{ name: 'FableSpace' }],
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
                    alt: 'FableSpace Library'
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
            index: false, // Library is user-specific, should not be indexed
            follow: true,
            googleBot: {
                index: false,
                follow: true
            }
        }
    }
}
