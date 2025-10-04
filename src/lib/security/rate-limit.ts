/**
 * Enhanced Rate Limiting Utility
 *
 * This module provides enhanced rate limiting for the FableSpace application.
 * It extends the base rate limiting implementation with additional features
 * like IP allowlisting, distributed rate limiting with Redis, and more
 * sophisticated progressive backoff.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import { headers } from 'next/headers';
import { ErrorCode, createErrorResponse } from '../error-handling';
import { logWarning, logError } from '../error-logger';

// Configuration options
export interface RateLimitConfig {
  // Maximum number of requests allowed within the window
  limit: number;
  // Time window in milliseconds
  windowMs: number;
  // Optional Redis client for distributed rate limiting
  redis?: Redis;
  // Key prefix for Redis
  keyPrefix?: string;
  // Whether to include user ID in the rate limit key (if authenticated)
  includeUserContext?: boolean;
  // Whether to implement progressive backoff
  useProgressiveBackoff?: boolean;
  // Maximum backoff factor
  maxBackoffFactor?: number;
  // IP addresses to exclude from rate limiting
  allowlistedIps?: string[];
  // Whether to skip rate limiting in development mode
  skipInDevelopment?: boolean;
  // Custom error message
  errorMessage?: string;
  // Whether to track and log suspicious activity
  trackSuspiciousActivity?: boolean;
  // Threshold for suspicious activity (requests over limit)
  suspiciousActivityThreshold?: number;
}

// Default configuration
const defaultConfig: RateLimitConfig = {
  limit: 5,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: 'ratelimit:',
  includeUserContext: false,
  useProgressiveBackoff: false,
  maxBackoffFactor: 10,
  allowlistedIps: [],
  skipInDevelopment: false,
  trackSuspiciousActivity: true,
  suspiciousActivityThreshold: 3, // 3x over limit is suspicious
};

// Rate limit configurations for different endpoint types
export const rateLimitConfigs = {
  // Default API endpoints
  default: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
  },

  // Authentication endpoints
  auth: {
    limit: 20,
    windowMs: 10 * 60 * 1000, // 10 minutes
    useProgressiveBackoff: true,
    trackSuspiciousActivity: true,
  },

  // Session endpoints (optimized to reduce polling load)
  session: {
    limit: 60,
    windowMs: 60 * 60 * 1000, // 1 hour
    useProgressiveBackoff: false,
    trackSuspiciousActivity: false,
  },

  // Credential login endpoints (more strict)
  credentialAuth: {
    limit: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    useProgressiveBackoff: true,
    maxBackoffFactor: 20,
    trackSuspiciousActivity: true,
    suspiciousActivityThreshold: 2, // More sensitive for auth endpoints
  },

  // OAuth login endpoints
  oauthAuth: {
    limit: 10,
    windowMs: 10 * 60 * 1000, // 10 minutes
    trackSuspiciousActivity: true,
  },

  // Editor endpoints (for autosave)
  editor: {
    limit: 120,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },

  // Forum post creation endpoints
  forumPosts: {
    limit: 3,
    windowMs: 60 * 1000, // 1 minute (3 posts per minute)
    includeUserContext: true, // Rate limit per user
    useProgressiveBackoff: true,
    trackSuspiciousActivity: true,
  },

  // Content creation endpoints
  contentCreation: {
    limit: 30,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },

  // Search endpoints
  search: {
    limit: 60,
    windowMs: 60 * 1000, // 1 minute
  },

  // Admin endpoints
  admin: {
    limit: 200,
    windowMs: 60 * 1000, // 1 minute
    includeUserContext: true,
  },

  // Public API endpoints
  publicApi: {
    limit: 50,
    windowMs: 60 * 1000, // 1 minute
  },

  // Webhook endpoints
  webhook: {
    limit: 30,
    windowMs: 60 * 1000, // 1 minute
  },
};

// Get client IP address from request
export async function getClientIp(req: NextRequest): Promise<string> {
  // Try to get the real IP from headers (if behind a proxy)
  try {
    const headersList = await headers();

    // Check for Cloudflare headers first
    const cfConnectingIp = headersList.get('cf-connecting-ip');
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }

    // Then check for standard forwarded headers
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    // Check for Vercel-specific headers
    const vercelIp = headersList.get('x-vercel-forwarded-for');
    if (vercelIp) {
      return vercelIp.split(',')[0].trim();
    }
  } catch (error) {
    logError(error, { context: 'Failed to get client IP from headers' });
    // Continue with fallback
  }

  // Fallback to direct IP from request
  try {
    // Try to get from connection info
    const connectionInfo = req.nextUrl.hostname || '127.0.0.1';
    return connectionInfo;
  } catch (error) {
    // Final fallback
    return '127.0.0.1';
  }
}

/**
 * Generate a rate limit key based on IP, path, and optionally user ID
 * @param req The request object
 * @param includeUserContext Whether to include user context in the key
 * @returns A rate limit key
 */
export async function generateRateLimitKey(req: NextRequest, includeUserContext: boolean = false): Promise<string> {
  // Get client IP
  const clientIp = await getClientIp(req);

  // Get the path
  const path = req.nextUrl.pathname;

  // Base key
  let key = `${clientIp}:${path}`;

  // If user context is included, add user ID if available
  if (includeUserContext) {
    try {
      // This is a simplified example - in a real implementation,
      // you would use your JWT verification function to get the user ID
      const authHeader = req.headers.get('authorization');

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        // Use a simple hash function instead of crypto
        // This is less secure but works in Edge runtime
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
          const char = token.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }

        key = `${key}:user:${Math.abs(hash).toString(16)}`;
      }
    } catch (error) {
      logError(error, { context: 'Generating rate limit key' })
      // Continue without user context if there's an error
    }
  }

  return key;
}

// In-memory store for rate limiting (use Redis in production)
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

// In-memory store for tracking suspicious activity
const suspiciousActivityStore = new Map<string, { count: number; lastSeen: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();

  // Clean up rate limit entries
  for (const [key, value] of inMemoryStore.entries()) {
    if (now > value.resetTime) {
      inMemoryStore.delete(key);
    }
  }

  // Clean up suspicious activity entries (keep for 24 hours)
  for (const [key, value] of suspiciousActivityStore.entries()) {
    if (now - value.lastSeen > 24 * 60 * 60 * 1000) {
      suspiciousActivityStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Track suspicious activity
 * @param ip The client IP address
 * @param path The request path
 * @param overLimitFactor How many times over the limit
 */
function trackSuspiciousActivity(ip: string, path: string, overLimitFactor: number, threshold: number): void {
  // Skip if not over threshold
  if (overLimitFactor < threshold) {
    return;
  }

  const key = `${ip}:${path}`;
  const now = Date.now();

  // Update or create entry
  if (suspiciousActivityStore.has(key)) {
    const entry = suspiciousActivityStore.get(key)!;
    entry.count += 1;
    entry.lastSeen = now;
  } else {
    suspiciousActivityStore.set(key, {
      count: 1,
      lastSeen: now,
    });
  }

  // Log suspicious activity
  const entry = suspiciousActivityStore.get(key)!;
  if (entry.count === 1 || entry.count % 10 === 0) { // Log on first occurrence and every 10th after
    logWarning('Suspicious rate limit activity detected', {
      ip,
      path,
      overLimitFactor,
      occurrences: entry.count,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Check if an IP is allowlisted
 * @param ip The IP address to check
 * @param allowlistedIps Array of allowlisted IPs or CIDR ranges
 * @returns Whether the IP is allowlisted
 */
function isIpAllowlisted(ip: string, allowlistedIps: string[] = []): boolean {
  // Direct match
  if (allowlistedIps.includes(ip)) {
    return true;
  }

  // Environment variable allowlist
  const envAllowlist = process.env.RATE_LIMIT_ALLOWLIST;
  if (envAllowlist) {
    const envAllowlistedIps = envAllowlist.split(',').map(ip => ip.trim());
    if (envAllowlistedIps.includes(ip)) {
      return true;
    }
  }

  // TODO: Add CIDR range checking for more sophisticated allowlisting

  return false;
}

/**
 * Rate limiting middleware for Next.js API routes
 */
export async function rateLimit(
  req: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<{ success: boolean; limit: number; remaining: number; reset: number; backoffFactor?: number }> {
  // Merge config with defaults
  const {
    limit,
    windowMs,
    redis,
    keyPrefix,
    includeUserContext,
    useProgressiveBackoff,
    maxBackoffFactor,
    allowlistedIps,
    skipInDevelopment,
    trackSuspiciousActivity: trackSuspicious,
    suspiciousActivityThreshold
  } = {
    ...defaultConfig,
    ...config,
  };

  // Skip in development if configured
  if (skipInDevelopment && process.env.NODE_ENV === 'development') {
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.ceil((Date.now() + windowMs) / 1000),
    };
  }

  // Get client IP
  const clientIp = await getClientIp(req);

  // Check if IP is allowlisted
  if (isIpAllowlisted(clientIp, allowlistedIps)) {
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.ceil((Date.now() + windowMs) / 1000),
    };
  }

  // Generate a unique key for this request
  const baseKey = await generateRateLimitKey(req, includeUserContext);
  const key = `${keyPrefix}${baseKey}`;

  // Current timestamp
  const now = Date.now();

  // If using Redis
  if (redis) {
    try {
      // Increment counter and set expiry
      const multi = redis.multi();
      multi.incr(key);
      multi.pttl(key);

      // If key is new, set expiry
      multi.setnx(key, '1');
      multi.pexpire(key, windowMs);

      const results = await multi.exec();
      if (!results) {
        throw new Error('Redis transaction failed');
      }

      const count = results[0][1] as number;
      let ttl = results[1][1] as number;

      // If TTL is -1 (no expiry set), set it now
      if (ttl === -1) {
        await redis.pexpire(key, windowMs);
        ttl = windowMs;
      }

      const resetTime = now + ttl;
      const remaining = Math.max(0, limit - count);

      // Calculate backoff factor if progressive backoff is enabled
      let backoffFactor = 1;
      if (useProgressiveBackoff && count > limit) {
        // Calculate how many times over the limit
        const overLimitFactor = Math.ceil(count / limit);

        // Track suspicious activity if enabled
        if (trackSuspicious) {
          trackSuspiciousActivity(
            clientIp,
            req.nextUrl.pathname,
            overLimitFactor,
            suspiciousActivityThreshold || defaultConfig.suspiciousActivityThreshold!
          );
        }

        // Apply progressive backoff, capped at maxBackoffFactor
        backoffFactor = Math.min(overLimitFactor, maxBackoffFactor || 10);
      }

      return {
        success: count <= limit,
        limit,
        remaining,
        reset: Math.ceil(resetTime / 1000), // Reset time in seconds
        ...(useProgressiveBackoff && { backoffFactor }),
      };
    } catch (error) {
      logError(error, { context: 'Redis rate limiting error' })
      // Fallback to in-memory store on Redis error
    }
  }

  // In-memory rate limiting
  if (!inMemoryStore.has(key)) {
    inMemoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + windowMs) / 1000),
      backoffFactor: 1,
    };
  }

  const record = inMemoryStore.get(key)!;

  // Reset if window has passed
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil(record.resetTime / 1000),
      backoffFactor: 1,
    };
  }

  // Increment count
  record.count += 1;
  const remaining = Math.max(0, limit - record.count);

  // Calculate backoff factor if progressive backoff is enabled
  let backoffFactor = 1;
  if (useProgressiveBackoff && record.count > limit) {
    // Calculate how many times over the limit
    const overLimitFactor = Math.ceil(record.count / limit);

    // Track suspicious activity if enabled
    if (trackSuspicious) {
      trackSuspiciousActivity(
        clientIp,
        req.nextUrl.pathname,
        overLimitFactor,
        suspiciousActivityThreshold || defaultConfig.suspiciousActivityThreshold!
      );
    }

    // Apply progressive backoff, capped at maxBackoffFactor
    backoffFactor = Math.min(overLimitFactor, maxBackoffFactor || 10);
  }

  return {
    success: record.count <= limit,
    limit,
    remaining,
    reset: Math.ceil(record.resetTime / 1000),
    ...(useProgressiveBackoff && { backoffFactor }),
  };
}

/**
 * Apply rate limiting to a Next.js API route handler
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  config: Partial<RateLimitConfig> = {}
) {
  return async function rateLimitHandler(req: NextRequest): Promise<NextResponse> {
    const rateLimitResult = await rateLimit(req, config);

    // If rate limit exceeded
    if (!rateLimitResult.success) {
      // Calculate retry-after time, considering backoff factor if present
      const retryAfterSeconds = Math.ceil((rateLimitResult.reset * 1000 - Date.now()) / 1000);
      const backoffRetryAfter = rateLimitResult.backoffFactor
        ? retryAfterSeconds * rateLimitResult.backoffFactor
        : retryAfterSeconds;

      return createErrorResponse(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        config.errorMessage || 'Rate limit exceeded. Please try again later.',
        {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
          retryAfter: backoffRetryAfter,
        }
      );
    }

    // Call the original handler
    const response = await handler(req);

    // Add rate limit headers to the response
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

    return response;
  };
}

/**
 * Create a rate limiter middleware for Next.js App Router
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  return async function rateLimiterMiddleware(req: NextRequest) {
    const rateLimitResult = await rateLimit(req, config);

    // If rate limit exceeded
    if (!rateLimitResult.success) {
      // Calculate retry-after time, considering backoff factor if present
      const retryAfterSeconds = Math.ceil((rateLimitResult.reset * 1000 - Date.now()) / 1000);
      const backoffRetryAfter = rateLimitResult.backoffFactor
        ? retryAfterSeconds * rateLimitResult.backoffFactor
        : retryAfterSeconds;

      return createErrorResponse(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        config.errorMessage || 'Rate limit exceeded. Please try again later.',
        {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
          retryAfter: backoffRetryAfter,
        }
      );
    }

    return null; // Continue to the next middleware or route handler
  };
}

/**
 * Get the Redis client for rate limiting
 * @returns A Redis client or null if not configured
 */
export function getRateLimitRedisClient(): any | null {
  // Check if we're in Edge Runtime
  const isEdgeRuntime = typeof process !== 'undefined' &&
    process.env.NEXT_RUNTIME === 'edge';

  // Don't use Redis in Edge Runtime
  if (isEdgeRuntime) {
    return null;
  }

  // Check if Redis is enabled for rate limiting
  if (process.env.RATE_LIMIT_REDIS_ENABLED !== 'true') {
    return null;
  }

  try {
    // Import the shared Redis client from the main Redis module
    const { getRedisClient } = require('../redis');
    return getRedisClient();
  } catch (error) {
    logWarning('Failed to get Redis client for rate limiting', { context: 'Rate Limiting' })
    return null;
  }
}

// Export a singleton Redis client for rate limiting
// Only initialize if not in Edge Runtime
let redisClient: any = null;
if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
  try {
    redisClient = getRateLimitRedisClient();
  } catch (error) {
    logWarning('Failed to initialize Redis client for rate limiting', { context: 'Rate Limiting' })
  }
}
export { redisClient };
