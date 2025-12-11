import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { applySecurityHeaders } from '@/lib/security/headers';
import { safeDecodeURIComponent } from '@/utils/safe-decode-uri-component';

// Note: Middleware runs in Edge Runtime by default

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
      // Log malformed params for debugging
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

  // ========================================
  // Rate Limiting
  // ========================================
  // Note: Rate limiting is now handled by the backend (fiction-app-backend)
  // We have removed the frontend-side rate limiting to avoid double-enforcement
  // and potential synchronization issues.
  // The backend uses Redis-backed rate limiting which is more robust.

  // ========================================
  // Authentication Protection for Protected Routes
  // ========================================
  const protectedRoutes = [
    '/settings',
    '/library',
    '/works',
    '/write',
    '/dashboard',
    '/notifications',
    '/complete-profile',
  ];

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // If route is protected, check for authentication
  if (isProtectedRoute) {
    const token = request.cookies.get('fablespace_access_token')?.value;
    const hasOldNextAuthCookie = request.cookies.get('next-auth.session-token')?.value;
    const hasSecureNextAuthCookie = request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''));

      const response = NextResponse.redirect(url);

      // Clean up old NextAuth cookies if they exist (migration from old auth system)
      if (hasOldNextAuthCookie || hasSecureNextAuthCookie) {
        response.cookies.delete('next-auth.session-token');
        response.cookies.delete('next-auth.callback-url');
        response.cookies.delete('next-auth.csrf-token');
        response.cookies.delete('__Secure-next-auth.session-token');
        response.cookies.delete('__Secure-next-auth.callback-url');
        response.cookies.delete('__Host-next-auth.csrf-token');
      }

      return response;
    }
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
  ],
};
