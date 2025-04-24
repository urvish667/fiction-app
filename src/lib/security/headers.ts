/**
 * Security Headers Configuration
 *
 * This module provides security headers for the FableSpace application
 * based on OWASP and web security best practices.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security header configuration
 */
export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://connect.facebook.net https://www.googletagmanager.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' ws: wss: https://apis.google.com https://www.googleapis.com https://securetoken.googleapis.com; " +
    "frame-src 'self' https://www.youtube.com https://www.facebook.com https://connect.facebook.net; " +
    "object-src 'none';",

  // Prevent clickjacking attacks
  'X-Frame-Options': 'SAMEORIGIN',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable strict HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Control browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * Apply security headers to a response
 * @param response The NextResponse object
 * @returns The response with security headers
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply each security header
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Middleware to apply security headers to all responses
 * @param request The incoming request
 * @returns The response with security headers
 */
export function withSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async function securityHeadersHandler(req: NextRequest) {
    // Call the original handler
    const response = await handler(req);

    // Apply security headers
    return applySecurityHeaders(response);
  };
}
