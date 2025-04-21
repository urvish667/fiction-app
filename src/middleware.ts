import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { csrfProtection } from '@/lib/security/csrf';
import { applySecurityHeaders } from '@/lib/security/headers';

// Protected routes that require authentication
const protectedRoutes = [
  '/write',
  '/settings',
  '/dashboard',
  '/works',
];

// Routes that require profile completion
const profileRequiredRoutes = [
  '/write',
  '/settings',
  '/dashboard',
  '/works',
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
  '/api/auth/signin/facebook',
];

// Note: We identify editor endpoints dynamically in the middleware function
// by checking for paths that include '/api/stories/' and '/chapters/'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Apply CSRF protection for non-GET requests to API routes
  // Exclude NextAuth routes from CSRF protection
  if (pathname.startsWith('/api/') &&
      !pathname.startsWith('/api/auth/') &&
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
    else if (pathname.includes('/signin/google') || pathname.includes('/signin/facebook')) {
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

  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
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
      (!token.isProfileComplete || token.needsProfileCompletion)) {
    // Redirect to profile completion page
    return NextResponse.redirect(new URL('/complete-profile', request.url));
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
