import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
      !token.emailVerified &&
      token.provider === 'credentials') {
    // Redirect to email verification page
    return NextResponse.redirect(new URL('/verify-email', request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Apply to all routes except static files, api routes, and _next
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
