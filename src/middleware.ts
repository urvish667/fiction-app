import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory store for rate limiting
// In production, use Redis or another distributed store
const rateLimit = {
  tokenBucket: new Map<string, { tokens: number; lastRefill: number }>(),
  
  // Rate limit configuration
  refillRate: 10, // tokens per second
  maxTokens: 50,  // maximum bucket size
  authPathTokenCost: 5, // cost for auth endpoints
  standardTokenCost: 1, // cost for standard endpoints
  
  // Check and consume tokens
  consume(ip: string, cost: number): boolean {
    const now = Date.now();
    let bucket = this.tokenBucket.get(ip);
    
    // Create bucket for new IP
    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.tokenBucket.set(ip, bucket);
      return true;
    }
    
    // Refill tokens based on time elapsed
    const timePassed = now - bucket.lastRefill;
    const refillAmount = (timePassed / 1000) * this.refillRate;
    
    bucket.tokens = Math.min(bucket.tokens + refillAmount, this.maxTokens);
    bucket.lastRefill = now;
    
    // Check if enough tokens and consume
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return true;
    }
    
    return false;
  },
  
  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    const expiryTime = 1 * 60 * 60 * 1000; // 1 hour
    
    for (const [ip, bucket] of this.tokenBucket.entries()) {
      if (now - bucket.lastRefill > expiryTime) {
        this.tokenBucket.delete(ip);
      }
    }
  }
};

// Clean up rate limit data every hour
setInterval(() => rateLimit.cleanup(), 60 * 60 * 1000);

export function middleware(request: NextRequest) {
  // Get client IP
  const ip = request.ip || 'unknown';
  const path = request.nextUrl.pathname;
  
  // Determine token cost based on path
  let tokenCost = rateLimit.standardTokenCost;
  
  // Higher cost for authentication endpoints
  if (path.startsWith('/api/auth')) {
    tokenCost = rateLimit.authPathTokenCost;
  }
  
  // Check rate limit
  if (!rateLimit.consume(ip, tokenCost)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests, please try again later' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    );
  }
  
  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply rate limiting to API routes
    '/api/:path*',
    // Exclude static files and other non-API routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
