import { NextRequest, NextResponse } from 'next/server'

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '11a132090fd9452786d10024fad4ce90'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fablespace.space'
const HOST = new URL(BASE_URL).hostname

// IndexNow supports multiple search engines — all of them cross-notify each other
// so a single submission to api.indexnow.org is sufficient.
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/**
 * POST /api/indexnow
 *
 * Notifies IndexNow-compatible search engines (Bing, Yandex, etc.) about
 * new or updated URLs so they get crawled faster.
 *
 * Body: { urls: string[] }
 *
 * On success returns the IndexNow API response status.
 * Can be called after story publish, update, or chapter creation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls } = body as { urls?: string[] }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Request body must include a non-empty "urls" array.' },
        { status: 400 }
      )
    }

    // Validate all URLs belong to our host — never ping 3rd-party URLs
    const invalid = urls.filter(u => {
      try {
        return new URL(u).hostname !== HOST
      } catch {
        return true
      }
    })
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: 'All URLs must belong to the site host.', invalid },
        { status: 400 }
      )
    }

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })

    // 200 = URL submitted, 202 = URL accepted (most common success)
    if (response.ok || response.status === 202) {
      return NextResponse.json(
        { success: true, submitted: urls.length, status: response.status },
        { status: 200 }
      )
    }

    const text = await response.text()
    return NextResponse.json(
      { error: 'IndexNow API error', details: text, status: response.status },
      { status: 502 }
    )
  } catch (error) {
    console.error('[IndexNow] Submission failed:', error)
    return NextResponse.json(
      { error: 'Internal server error during IndexNow submission.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/indexnow
 *
 * Quick health-check — returns the configured key and host so you can
 * verify the integration is wired up correctly.
 */
export async function GET() {
  return NextResponse.json({
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    endpoint: INDEXNOW_ENDPOINT,
  })
}
