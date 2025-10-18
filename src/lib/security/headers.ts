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
  'Content-Security-Policy':
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
    "https://apis.google.com https://connect.facebook.net https://www.googletagmanager.com " +
    "https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com " +
    "https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net " +
    "https://tpc.googlesyndication.com https://securepubads.g.doubleclick.net " +
    "*.adtrafficquality.google *.googlesyndication.com *.googleadservices.com *.doubleclick.net " +
    "fundingchoicesmessages.google.com https://ads.fablespace.space " +
    "https://static.cloudflareinsights.com;" +
  "fenced-frame-src 'self' blob: data: " +
    "https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com " +
    "https://*.googleadservices.com https://*.ezoic.net https://*.ezodn.com https://*.ezojs.com " +
    "https://*.gatekeeperconsent.com https://*.adtrafficquality.google " +
    "https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net " +
    "https://ad.doubleclick.net https://adservice.google.com " +
    "https://securepubads.g.doubleclick.net https://tpc.googlesyndication.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "img-src 'self' data: https: blob: https://ads.fablespace.space; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "connect-src 'self' ws: wss: " +
    "https://apis.google.com https://www.googleapis.com https://securetoken.googleapis.com " +
    "https://api.stripe.com https://api.paypal.com https://www.sandbox.paypal.com " +
    "https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net " +
    "https://tpc.googlesyndication.com https://securepubads.g.doubleclick.net " +
    "https://www.google-analytics.com " +
    "*.google.com *.googlesyndication.com *.googleadservices.com *.adtrafficquality.google " +
    "*.adsterra.com *.pop.adsterra.com *.profitableratecpm.com *.highperformanceformat.com professionaltrafficmonitor.com; " +
  "frame-src 'self' https://www.youtube.com https://www.facebook.com https://connect.facebook.net " +
    "https://checkout.stripe.com https://js.stripe.com https://www.paypal.com " +
    "https://www.sandbox.paypal.com https://googleads.g.doubleclick.net " +
    "https://tpc.googlesyndication.com https://securepubads.g.doubleclick.net " +
    "*.googlesyndication.com *.doubleclick.net *.adtrafficquality.google https://www.google.com " +
    "https://ads.fablespace.space *.pop.adsterra.com; " +
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
 * @param handler The incoming request
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
