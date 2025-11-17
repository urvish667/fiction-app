import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/security/rate-limit';
import { csrfProtection } from '@/lib/security/csrf';
import { applySecurityHeaders } from '@/lib/security/headers';
import { safeDecodeURIComponent } from '@/utils/safe-decode-uri-component';

// Note: Middleware runs in Edge Runtime by default
// The security rate limiter automatically uses in-memory storage in Edge Runtime
// In Node.js API routes, it can use Redis if available

// Helper function to calculate retry time
function getRetryAfter(result: { reset: number; backoffFactor?: number }): number {
  const baseRetry = Math.ceil((result.reset * 1000 - Date.now()) / 1000);
  return result.backoffFactor ? baseRetry * result.backoffFactor : baseRetry;
}

// Helper function to generate rate limit error response
function createRateLimitResponse(
  result: { limit: number; remaining: number; reset: number; backoffFactor?: number },
  error: string,
  message: string
): NextResponse {
  const retryAfter = getRetryAfter(result);
  return new NextResponse(
    JSON.stringify({
      error,
      message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

// Auth routes that should be rate limited (now these are backend routes)
const authRateLimitedRoutes = [
  // Since auth is now handled by backend, we don't need these frontend routes
  // Keeping this for any remaining frontend auth routes if needed
];

// Optional: List of known bad bots (for extra protection)
const knownBadBots = [
  'python-requests',
  'curl',
  'libwww-perl',
  'HttpClient',
  'Go-http-client',
  'scrapy',
  'wget',
  'scanner',
  'attack',
  'bot',
];

// Note: We identify editor endpoints dynamically in the middleware function
// by checking for paths that include '/api/stories/' and '/chapters/'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get("user-agent") || "";
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || 'Unknown';

  // Sanitize search params to prevent URI malformed errors
  const newSearchParams = new URLSearchParams();
  let hasMalformedParams = false;

  for (const [key, value] of searchParams.entries()) {
    const decodedValue = safeDecodeURIComponent(value);
    if (decodedValue === null) {
      hasMalformedParams = true;
      // Decide how to handle malformed params.
      // Option 1: Skip the parameter.
      // newSearchParams.set(key, ''); // or some default
      // Option 2: Redirect to a clean URL.
      // For now, we will log it and redirect to the base path.
      console.error("🚨 Malformed URI Param Detected", {
        key,
        value,
        pathname,
        method,
        userAgent,
        ip,
      });
    } else {
      newSearchParams.set(key, value);
    }
  }

  if (hasMalformedParams) {
    const url = new URL(pathname, request.url);
    // To keep other valid params, uncomment the next line
    // url.search = newSearchParams.toString();
    return NextResponse.redirect(url);
  }

  // Apply CSRF protection for non-GET requests to API routes
  // Since auth moved to backend, we can remove the auth exclusion
  if (pathname.startsWith('/api/') &&
      !pathname.startsWith('/api/webhooks/') &&
      !pathname.startsWith('/api/scheduled-tasks') &&
      !pathname.startsWith('/api/cron/') && // Exclude cron endpoints (use API key auth)
      !pathname.startsWith('/api/recommendations/generate') &&
      !pathname.startsWith('/api/report') &&
      !pathname.startsWith('/api/csrf/') && // Exclude CSRF setup endpoint
      !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfResult = await csrfProtection(request);
    if (csrfResult) {
      return csrfResult;
    }
  }

  // Apply rate limiting based on endpoint type
  // Check if this is an editor endpoint that needs special rate limiting
  const isEditorEndpoint = pathname.includes('/api/stories/') &&
    (pathname.includes('/chapters/') || pathname.endsWith('/chapters'));

  // Check if this is a forum post endpoint that needs special rate limiting
  const isForumPostEndpoint = pathname.includes('/api/forum/') &&
    pathname.includes('/posts') && method === 'POST';

  // Apply higher rate limits for editor endpoints (for autosave functionality)
  if (isEditorEndpoint) {
    const result = await rateLimit(request, {
      ...rateLimitConfigs.editor,
      includeUserContext: true,
    });

    if (!result.success) {
      return createRateLimitResponse(
        result,
        'Too many editor requests',
        'You have exceeded the rate limit for editor operations. Please try again later.'
      );
    }
  }
  // Apply forum posts rate limiting
  else if (isForumPostEndpoint) {
    const result = await rateLimit(request, {
      ...rateLimitConfigs.forumPosts,
      includeUserContext: true,
    });

    if (!result.success) {
      return createRateLimitResponse(
        result,
        'Too many forum posts',
        'You can only create up to 3 posts per minute. Please try again later.'
      );
    }
  }

  // Apply default rate limiting to all other API endpoints
  else if (pathname.startsWith('/api/')) {
    const result = await rateLimit(request, {
      ...rateLimitConfigs.default,
      includeUserContext: true,
    });

    if (!result.success) {
      return createRateLimitResponse(
        result,
        'Too many requests',
        'Rate limit exceeded. Please try again later.'
      );
    }
  }

  // Removed authentication and profile completion checks since auth is now cookie-based
  // and handled by the backend. The client-side useAuth hook will handle authentication state
  // and protected routes are handled by individual components.

  // Apply security headers to the response
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Apply to all routes except static files and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
