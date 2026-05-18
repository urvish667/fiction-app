import { NextResponse } from 'next/server'

export const revalidate = 86400 // Revalidate once per day

/**
 * Explicit /sitemap.xml route for Next.js standalone (Docker) output.
 *
 * In standalone mode, Next.js does NOT auto-generate the sitemap index
 * at /sitemap.xml when `generateSitemaps()` is used. This route fills
 * that gap by manually returning a valid XML sitemap index.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap/0.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/2.xml</loc>
  </sitemap>
</sitemapindex>`

  return new NextResponse(sitemapIndex, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  })
}
