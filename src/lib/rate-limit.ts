import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import { headers } from 'next/headers';
import { ErrorCode, createErrorResponse } from './error-handling';

// Configuration options
interface RateLimitConfig {
  // Maximum number of requests allowed within the window
  limit: number;
  // Time window in seconds
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
}

// Default configuration
const defaultConfig: RateLimitConfig = {
  limit: 5,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: 'ratelimit:',
  includeUserContext: false,
  useProgressiveBackoff: false,
  maxBackoffFactor: 10,
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
  },

  // Credential login endpoints (more strict)
  credentialAuth: {
    limit: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    useProgressiveBackoff: true,
    maxBackoffFactor: 20,
  },

  // OAuth login endpoints
  oauthAuth: {
    limit: 10,
    windowMs: 10 * 60 * 1000, // 10 minutes
  },

  // Editor endpoints (for autosave)
  editor: {
    limit: 120,
    windowMs: 5 * 60 * 1000, // 5 minutes
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
};

// Get client IP address from request
async function getClientIp(req: NextRequest): Promise<string> {
  // Try to get the real IP from headers (if behind a proxy)
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
  } catch (error) {
    console.error('Error getting headers:', error);
    // Continue with fallback
  }

  // Fallback to direct IP from request
  // In newer Next.js versions, we need to get it from headers
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
async function generateRateLimitKey(req: NextRequest, includeUserContext: boolean = false): Promise<string> {
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
      console.error('Error getting user context for rate limiting:', error);
      // Continue without user context if there's an error
    }
  }

  return key;
}

// In-memory store for rate limiting (use Redis in production)
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of inMemoryStore.entries()) {
    if (now > value.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

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
    maxBackoffFactor
  } = {
    ...defaultConfig,
    ...config,
  };

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
      console.error('Redis rate limiting error:', error);
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
        'Rate limit exceeded. Please try again later.',
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
        'Rate limit exceeded. Please try again later.',
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
