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
          '/browse*', // Allow category and search pages
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/blog',
          '/challenges',
          '/works/*',
          '/donate/*',
          '/_next/static/',
          '/_next/data/',
        ],
        disallow: [
          '/api/',
          '/api/*',
          '/write/*',
          '/settings/*',
          '/dashboard/*',
          '/library/*',
          '/notifications/*',
          '/login',
          '/signup',
          '/reset-password/*',
          '/verify-email',
          '/complete-profile',
          '/test-images/*',
          '/admin/*',
        ],
      },
      // ✅ ALLOW LLM BOTS
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'Claude-Web', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'youBot', allow: '/' },
      { userAgent: 'NeevaBot', allow: '/' },
      { userAgent: 'DuckDuckBot', allow: '/' },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
