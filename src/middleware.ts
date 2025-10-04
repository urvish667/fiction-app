import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimit, rateLimitConfigs } from '@/lib/security/rate-limit';
import { csrfProtection } from '@/lib/security/csrf';
import { applySecurityHeaders } from '@/lib/security/headers';
import { safeDecodeURIComponent } from '@/utils/safe-decode-uri-component';

// Note: In Edge Runtime, we can't use Redis directly
// The rate limiting will fall back to in-memory storage

// Protected routes that require authentication
const protectedRoutes = [
  '/write',
  '/settings',
  '/dashboard',
  '/works',
];

// Routes that require profile completion
// Only require profile completion for content creation and user management
const profileRequiredRoutes = [
  '/write',
  '/settings',
  '/dashboard',
  '/works',
  '/profile',
  '/library',
  '/notifications',
];

// Routes that are exempt from profile completion check
const profileExemptRoutes = [
  '/complete-profile',
  '/verify-email',
];

// Auth routes that should be rate limited
const authRateLimitedRoutes = [
  '/api/auth/signin',
  '/api/auth/callback',
  '/api/auth/signin/credentials',
  '/api/auth/signin/google',
  '/api/auth/signin/twitter',
  '/api/auth/reset-password',
  '/api/auth/complete-profile',
  '/api/auth/resend-verification',
  '/api/auth/session-update',
  '/api/auth/ws-token',
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
  // Exclude NextAuth routes, webhooks, scheduled tasks, and recommendation generation from CSRF protection
  if (pathname.startsWith('/api/') &&
      !pathname.startsWith('/api/auth/') &&
      !pathname.startsWith('/api/webhooks/') &&
      !pathname.startsWith('/api/scheduled-tasks') &&
      !pathname.startsWith('/api/recommendations/generate') &&
      !pathname.startsWith('/api/report') &&
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
    // Use editor-specific rate limit config
    const result = await rateLimit(request, {
      ...rateLimitConfigs.editor,
      includeUserContext: true, // Include user context for more accurate limiting
    });

    if (!result.success) {
      // Rate limit response is handled by the rateLimit function
      return new NextResponse(
        JSON.stringify({
          error: 'Too many editor requests',
          message: 'You have exceeded the rate limit for editor operations. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.backoffFactor ? Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor : Math.ceil((result.reset * 1000 - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': result.backoffFactor ?
              (Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor).toString() :
              Math.ceil((result.reset * 1000 - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }
  // Apply rate limiting to auth endpoints
  else if (authRateLimitedRoutes.some(route => pathname.startsWith(route))) {
    // More strict rate limiting for credential signin (to prevent brute force)
    if (pathname.includes('/signin/credentials')) {
      const result = await rateLimit(request, {
        ...rateLimitConfigs.credentialAuth,
        includeUserContext: false, // Don't include user context for login attempts
      });

      if (!result.success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many login attempts',
            message: 'Please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: result.backoffFactor ? Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor : Math.ceil((result.reset * 1000 - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.reset.toString(),
              'Retry-After': result.backoffFactor ?
                (Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor).toString() :
                Math.ceil((result.reset * 1000 - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    }
    // Less strict rate limiting for OAuth signin
    else if (pathname.includes('/signin/google') || pathname.includes('/signin/twitter')) {
      const result = await rateLimit(request, {
        ...rateLimitConfigs.oauthAuth,
      });

      if (!result.success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many login attempts',
            message: 'Please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: result.backoffFactor ? Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor : Math.ceil((result.reset * 1000 - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.reset.toString(),
              'Retry-After': result.backoffFactor ?
                (Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor).toString() :
                Math.ceil((result.reset * 1000 - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    }
    // General auth endpoints
    else if (pathname.startsWith('/api/auth')) {
      const result = await rateLimit(request, {
        ...rateLimitConfigs.auth,
      });

      if (!result.success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests',
            message: 'Please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: result.backoffFactor ? Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor : Math.ceil((result.reset * 1000 - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.reset.toString(),
              'Retry-After': result.backoffFactor ?
                (Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor).toString() :
                Math.ceil((result.reset * 1000 - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    }
  }
  // Apply forum posts rate limiting
  else if (isForumPostEndpoint) {
    const result = await rateLimit(request, {
      ...rateLimitConfigs.forumPosts,
      includeUserContext: true, // Rate limit per user for forum posts
    });

    if (!result.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many forum posts',
          message: 'You can only create up to 3 posts per minute. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.backoffFactor ? Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor : Math.ceil((result.reset * 1000 - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': result.backoffFactor ?
              (Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor).toString() :
              Math.ceil((result.reset * 1000 - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  // Apply default rate limiting to all other API endpoints
  else if (pathname.startsWith('/api/')) {
    const result = await rateLimit(request, {
      ...rateLimitConfigs.default,
      includeUserContext: true, // Include user context for more accurate limiting
    });

    if (!result.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.backoffFactor ? Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor : Math.ceil((result.reset * 1000 - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': result.backoffFactor ?
              (Math.ceil((result.reset * 1000 - Date.now()) / 1000) * result.backoffFactor).toString() :
              Math.ceil((result.reset * 1000 - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  // Skip middleware for exempt routes
  if (profileExemptRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get the session token with improved configuration for production
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production", // Ensure secure cookies in production
    cookieName: "next-auth.session-token" // Explicitly specify the cookie name
  });

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // If there's no token, redirect to the login page with a return URL
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Check if user needs to complete their profile
  if (token &&
      profileRequiredRoutes.some(route => pathname.startsWith(route)) &&
      (!token.isProfileComplete || token.needsProfileCompletion || !token.username)) {
    // Redirect to profile completion page
    return NextResponse.redirect(new URL('/complete-profile', request.url));
  }

  // Also check for social interaction pages that require complete profiles
  // These are pages where users would typically perform social actions
  const socialInteractionPages = [
    '/user/', // User profile pages where you can follow
    '/story/', // Story pages where you can like/comment
  ];

  if (token &&
      socialInteractionPages.some(route => pathname.startsWith(route)) &&
      (!token.isProfileComplete || token.needsProfileCompletion || !token.username)) {
    // For social interaction pages, redirect to profile completion with return URL
    const completeProfileUrl = new URL('/complete-profile', request.url);
    completeProfileUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(completeProfileUrl);
  }

  // Check if email verification is required
  if (token &&
      profileRequiredRoutes.some(route => pathname.startsWith(route)) &&
      token.provider === 'credentials' &&
      !token.emailVerified) {
    // Redirect to email verification page with callback URL
    const verifyEmailUrl = new URL('/verify-email', request.url);
    verifyEmailUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(verifyEmailUrl);
  }

  // Apply security headers to the response
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Apply to all routes except static files and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
    // Include API auth routes for rate limiting
    '/api/auth/:path*',
  ],
};
