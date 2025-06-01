import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'

  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: [
          '/',
          '/story/*',
          '/user/*',
          '/browse',
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/blog',
          '/challenges',
          '/_next/static/', // ✅ allow essential static assets
        ],
        disallow: [
          '/_next/data/',    // ✅ only disallow data routes, not all _next
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
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      {
        userAgent: 'Claude-Web',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
