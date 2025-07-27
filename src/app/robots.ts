import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/write',
          '/settings',
          '/dashboard',
          '/library',
          '/notifications',
          '/login',
          '/signup',
          '/reset-password',
          '/verify-email',
          '/complete-profile',
        ],
      },
      // Allow all LLM bots full access
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
