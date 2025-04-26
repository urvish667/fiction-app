/**
 * Middleware for the NextAuth session endpoint
 * 
 * This middleware applies rate limiting to the session endpoint to prevent
 * excessive polling and reduce server load.
 */

import { NextRequest } from 'next/server';
import { createRateLimiter, rateLimitConfigs } from '@/lib/security/rate-limit';

// Create a rate limiter specifically for session endpoints
const sessionRateLimiter = createRateLimiter(rateLimitConfigs.session);

export async function middleware(request: NextRequest) {
  // Apply rate limiting to session endpoint
  return sessionRateLimiter(request);
}

// Configure the middleware to run only for the session endpoint
export const config = {
  matcher: '/api/auth/session',
};
