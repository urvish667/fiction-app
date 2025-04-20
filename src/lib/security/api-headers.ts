/**
 * API Headers Configuration
 * 
 * This module provides enhanced security headers specifically for API routes
 * in the FableSpace application. It extends the base security headers with
 * additional API-specific headers and cache control.
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityHeaders, applySecurityHeaders } from './headers';

// Cache control directives
export enum CacheControl {
  // No caching
  NO_STORE = 'no-store, no-cache, must-revalidate, proxy-revalidate',
  // Short-term caching (5 minutes)
  SHORT = 'public, max-age=300, s-maxage=300',
  // Medium-term caching (1 hour)
  MEDIUM = 'public, max-age=3600, s-maxage=3600',
  // Long-term caching (1 day)
  LONG = 'public, max-age=86400, s-maxage=86400',
  // Very long-term caching (1 week)
  VERY_LONG = 'public, max-age=604800, s-maxage=604800',
  // Immutable content (1 year)
  IMMUTABLE = 'public, max-age=31536000, immutable',
}

// API-specific security headers
export const apiSecurityHeaders = {
  ...securityHeaders,
  // Prevent browsers from MIME-sniffing
  'X-Content-Type-Options': 'nosniff',
  // Disable client-side caching by default for API responses
  'Cache-Control': CacheControl.NO_STORE,
  // Prevent embedding API responses in iframes
  'X-Frame-Options': 'DENY',
  // Add Timing-Allow-Origin header to allow timing information to be shared
  'Timing-Allow-Origin': '*',
  // Add API version header
  'X-API-Version': process.env.API_VERSION || '1.0.0',
};

/**
 * Apply API security headers to a response
 * @param response The NextResponse object
 * @param cacheControl Optional cache control directive
 * @returns The response with API security headers
 */
export function applyApiSecurityHeaders(
  response: NextResponse,
  cacheControl?: CacheControl
): NextResponse {
  // Apply base security headers
  applySecurityHeaders(response);
  
  // Apply API-specific headers
  Object.entries(apiSecurityHeaders).forEach(([key, value]) => {
    // Skip Cache-Control if a custom directive is provided
    if (key === 'Cache-Control' && cacheControl) {
      response.headers.set(key, cacheControl);
    } else {
      response.headers.set(key, value);
    }
  });
  
  return response;
}

/**
 * Middleware to apply API security headers to responses
 * @param handler The API route handler
 * @param cacheControl Optional cache control directive
 */
export function withApiSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  cacheControl?: CacheControl
) {
  return async function apiSecurityHeadersHandler(req: NextRequest) {
    // Call the original handler
    const response = await handler(req);
    
    // Apply API security headers
    return applyApiSecurityHeaders(response, cacheControl);
  };
}

/**
 * Add CORS headers to a response
 * @param response The NextResponse object
 * @param origin The allowed origin (default: '*')
 * @param methods The allowed methods (default: 'GET, POST, PUT, DELETE, OPTIONS')
 * @param headers The allowed headers (default: '*')
 * @returns The response with CORS headers
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string = '*',
  methods: string = 'GET, POST, PUT, DELETE, OPTIONS',
  headers: string = '*'
): NextResponse {
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', methods);
  response.headers.set('Access-Control-Allow-Headers', headers);
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

/**
 * Middleware to handle CORS preflight requests and add CORS headers
 * @param handler The API route handler
 * @param origin The allowed origin (default: '*')
 * @param methods The allowed methods (default: 'GET, POST, PUT, DELETE, OPTIONS')
 * @param headers The allowed headers (default: '*')
 */
export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  origin: string = '*',
  methods: string = 'GET, POST, PUT, DELETE, OPTIONS',
  headers: string = '*'
) {
  return async function corsHandler(req: NextRequest) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      return addCorsHeaders(response, origin, methods, headers);
    }
    
    // Call the original handler
    const response = await handler(req);
    
    // Add CORS headers to the response
    return addCorsHeaders(response, origin, methods, headers);
  };
}

/**
 * Combine multiple middleware functions into a single middleware
 * @param middlewares Array of middleware functions
 */
export function combineMiddleware(
  ...middlewares: ((handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) => 
    (req: NextRequest) => Promise<NextResponse> | NextResponse)[]
) {
  return (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
