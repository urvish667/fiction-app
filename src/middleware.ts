import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { applySecurityHeaders } from '@/lib/security/headers';
import { safeDecodeURIComponent } from '@/utils/safe-decode-uri-component';
import { renderRouteAsMarkdown } from '@/lib/agent/markdown-renderer';

// Helper to determine if client prefers text/markdown over HTML
function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;
  if (!acceptHeader.includes('text/markdown')) return false;

  const parts = acceptHeader.split(',').map((part) => {
    const [mime, ...params] = part.trim().split(';');
    let q = 1.0;
    for (const p of params) {
      const [k, v] = p.trim().split('=');
      if (k === 'q' && v) {
        q = parseFloat(v) || 0;
      }
    }
    return { mime: mime.trim().toLowerCase(), q };
  });

  const markdownType = parts.find((p) => p.mime === 'text/markdown');
  if (!markdownType || markdownType.q === 0) return false;

  const htmlType = parts.find((p) => p.mime === 'text/html');
  if (!htmlType) return true;

  return markdownType.q >= htmlType.q;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get("user-agent") || "";
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || 'Unknown';
  const acceptHeader = request.headers.get('accept');

  // Sanitize search params to prevent URI malformed errors
  const newSearchParams = new URLSearchParams();
  let hasMalformedParams = false;

  for (const [key, value] of searchParams.entries()) {
    const decodedValue = safeDecodeURIComponent(value);
    if (decodedValue === null) {
      hasMalformedParams = true;
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
    return NextResponse.redirect(url);
  }

  // ========================================
  // Markdown Content Negotiation (acceptmarkdown.com standard)
  // ========================================
  const isExcludedFromMarkdown =
    pathname.startsWith('/api/') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.txt') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg');

  if ((method === 'GET' || method === 'HEAD') && !isExcludedFromMarkdown && prefersMarkdown(acceptHeader)) {
    const result = renderRouteAsMarkdown({ pathname, searchParams });
    const markdownResponse = new NextResponse(result.markdown, {
      status: result.status,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept, Accept-Encoding',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
    return applySecurityHeaders(markdownResponse);
  }

  // ========================================
  // Authentication Protection for Protected Routes
  // ========================================
  const protectedRoutes = [
    '/settings',
    '/library',
    '/dashboard',
    '/notifications',
    '/complete-profile',
  ];

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const token = request.cookies.get('fablespace_access_token')?.value;
    const hasOldNextAuthCookie = request.cookies.get('next-auth.session-token')?.value;
    const hasSecureNextAuthCookie = request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''));

      const response = NextResponse.redirect(url);

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

  // Apply security & caching headers to the response
  const response = NextResponse.next();
  response.headers.set('Vary', 'Accept, Accept-Encoding');
  return applySecurityHeaders(response);
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Apply to all routes except static files and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
