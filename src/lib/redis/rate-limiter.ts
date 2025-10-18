/**
 * Redis-based Rate Limiter
 * 
 * Implements distributed rate limiting using Redis sorted sets with sliding window algorithm.
 * This provides accurate rate limiting across multiple server instances.
 * 
 * Key Features:
 * - Sliding window algorithm for accurate rate limiting
 * - Distributed across all server instances
 * - Persistent across restarts
 * - Configurable per endpoint
 * - Automatic cleanup of old entries
 */

import { Redis } from 'ioredis';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds until retry
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  // Maximum number of requests allowed
  limit: number;
  // Time window in milliseconds
  windowMs: number;
  // Key prefix for Redis
  keyPrefix?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: 'ratelimit:',
};

/**
 * Check rate limit using Redis sorted sets with sliding window
 * 
 * Algorithm:
 * 1. Remove old entries outside the time window
 * 2. Count current entries in the window
 * 3. If under limit, add new entry
 * 4. Return result with remaining count
 * 
 * @param redis Redis client
 * @param key Rate limit key (e.g., "ratelimit:ip:path")
 * @param config Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  redis: Redis,
  key: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const { limit, windowMs, keyPrefix } = { ...DEFAULT_CONFIG, ...config };
  const fullKey = `${keyPrefix}${key}`;

  try {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Use Lua script for atomic operations
    // This ensures race conditions don't cause incorrect counts
    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window_start = tonumber(ARGV[2])
      local limit = tonumber(ARGV[3])
      local window_ms = tonumber(ARGV[4])
      
      -- Remove old entries
      redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
      
      -- Count current entries
      local count = redis.call('ZCARD', key)
      
      -- Check if under limit
      if count < limit then
        -- Add new entry with unique ID
        local entry_id = now .. '-' .. redis.call('INCR', key .. ':counter')
        redis.call('ZADD', key, now, entry_id)
        
        -- Set expiration (window + 1 minute buffer)
        redis.call('PEXPIRE', key, window_ms + 60000)
        
        count = count + 1
      end
      
      -- Return count
      return count
    `;

    // Execute Lua script
    const count = await redis.eval(
      luaScript,
      1,
      fullKey,
      now.toString(),
      windowStart.toString(),
      limit.toString(),
      windowMs.toString()
    ) as number;

    const remaining = Math.max(0, limit - count);
    const resetTime = Math.ceil((now + windowMs) / 1000);

    if (count > limit) {
      // Rate limit exceeded
      const oldestEntry = await redis.zrange(fullKey, 0, 0, 'WITHSCORES');
      const oldestTimestamp = oldestEntry.length > 1 ? parseInt(oldestEntry[1], 10) : now;
      const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      return {
        success: false,
        limit,
        remaining: 0,
        reset: resetTime,
        retryAfter: Math.max(1, retryAfter),
      };
    }

    return {
      success: true,
      limit,
      remaining,
      reset: resetTime,
    };
  } catch (error) {
    logger.error('Rate limit check failed:', error);
    
    // On error, allow the request (fail open)
    // This prevents Redis issues from blocking all traffic
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.ceil((Date.now() + windowMs) / 1000),
    };
  }
}

/**
 * Rate limit a request
 * This is a convenience wrapper that gets the Redis client automatically
 * 
 * @param key Rate limit key
 * @param config Rate limit configuration
 * @returns Rate limit result
 */
export async function rateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (!redis) {
    // Redis not available, allow request (fail open)
    logger.warn('Redis not available for rate limiting, allowing request');
    const { limit, windowMs } = { ...DEFAULT_CONFIG, ...config };
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.ceil((Date.now() + windowMs) / 1000),
    };
  }

  return checkRateLimit(redis, key, config);
}

/**
 * Reset rate limit for a key
 * Useful for testing or manual intervention
 * 
 * @param key Rate limit key
 * @param keyPrefix Key prefix
 */
export async function resetRateLimit(key: string, keyPrefix: string = 'ratelimit:'): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    logger.warn('Redis not available, cannot reset rate limit');
    return;
  }

  try {
    const fullKey = `${keyPrefix}${key}`;
    await redis.del(fullKey);
    await redis.del(`${fullKey}:counter`);
    logger.info(`Rate limit reset for key: ${key}`);
  } catch (error) {
    logger.error('Failed to reset rate limit:', error);
  }
}

/**
 * Get current rate limit status without incrementing
 * Useful for monitoring
 * 
 * @param key Rate limit key
 * @param config Rate limit configuration
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  key: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const { limit, windowMs, keyPrefix } = { ...DEFAULT_CONFIG, ...config };

  if (!redis) {
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.ceil((Date.now() + windowMs) / 1000),
    };
  }

  try {
    const fullKey = `${keyPrefix}${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old entries
    await redis.zremrangebyscore(fullKey, 0, windowStart);

    // Count current entries
    const count = await redis.zcard(fullKey);
    const remaining = Math.max(0, limit - count);
    const resetTime = Math.ceil((now + windowMs) / 1000);

    return {
      success: count < limit,
      limit,
      remaining,
      reset: resetTime,
    };
  } catch (error) {
    logger.error('Failed to get rate limit status:', error);
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.ceil((Date.now() + windowMs) / 1000),
    };
  }
}

/**
 * Cleanup old rate limit entries
 * This should be run periodically to prevent memory bloat
 * Note: Individual keys auto-expire, but this provides extra cleanup
 */
export async function cleanupRateLimits(keyPrefix: string = 'ratelimit:'): Promise<number> {
  const redis = getRedisClient();

  if (!redis) {
    return 0;
  }

  try {
    const pattern = `${keyPrefix}*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }

    let cleaned = 0;
    const now = Date.now();

    // Process in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (key) => {
          // Skip counter keys
          if (key.endsWith(':counter')) {
            return;
          }

          // Remove entries older than 1 hour
          const removed = await redis.zremrangebyscore(key, 0, now - 60 * 60 * 1000);
          
          // If no entries left, delete the key
          const count = await redis.zcard(key);
          if (count === 0) {
            await redis.del(key);
            await redis.del(`${key}:counter`);
            cleaned++;
          }
        })
      );
    }

    logger.info(`Cleaned up ${cleaned} empty rate limit keys`);
    return cleaned;
  } catch (error) {
    logger.error('Failed to cleanup rate limits:', error);
    return 0;
  }
}
