import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/story/*',
          '/user/*',
          '/browse',
          '/browse?*', // Allow category and search pages
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/blog',
          '/challenges',
          '/_next/static/',
          '/_next/data/', // ✅ now allowed
        ],
        disallow: [
          '/api/',
          '/api/*',
          '/write/*',
          '/settings/*',
          '/dashboard/*',
          '/works/*',
          '/library/*',
          '/notifications/*',
          '/login',
          '/signup',
          '/reset-password/*',
          '/verify-email',
          '/complete-profile',
          '/donate/*',
          '/test-images/*',
          '/admin/*',
        ],
      },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'Claude-Web', disallow: '/' },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
