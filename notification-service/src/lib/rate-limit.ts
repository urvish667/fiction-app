/**
 * Rate limiting utility for WebSocket connections
 *
 * This module provides rate limiting functionality for WebSocket connections
 * to prevent abuse and protect the service from DoS attacks.
 */

import { logger } from './logger';

// Rate limit configuration
interface RateLimitConfig {
  // Maximum number of connections per time window
  maxConnections: number;
  // Time window in milliseconds
  windowMs: number;
  // Whether to implement progressive backoff
  useProgressiveBackoff: boolean;
}

// Default configuration
const DEFAULT_CONFIG: RateLimitConfig = {
  maxConnections: 60, // 60 connections per minute
  windowMs: 60 * 1000, // 1 minute
  useProgressiveBackoff: true,
};

// Store connection attempts by IP
const connectionStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if an IP has exceeded the rate limit
 * @param ip The IP address
 * @param config Rate limit configuration
 * @returns Whether the IP has exceeded the rate limit
 */
export function isRateLimited(
  ip: string,
  config: Partial<RateLimitConfig> = {}
): { limited: boolean; resetTime: number; remaining: number } {
  // Merge config with defaults
  const { maxConnections, windowMs, useProgressiveBackoff } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Get current time
  const now = Date.now();

  // Get or create record for this IP
  let record = connectionStore.get(ip);
  if (!record || record.resetTime <= now) {
    // Create new record or reset expired record
    record = {
      count: 0,
      resetTime: now + windowMs,
    };
    connectionStore.set(ip, record);
  }

  // Increment count
  record.count += 1;

  // Calculate remaining connections
  const remaining = Math.max(0, maxConnections - record.count);

  // Check if rate limited
  let limited = record.count > maxConnections;

  // Apply progressive backoff if enabled
  if (useProgressiveBackoff && limited) {
    // Calculate how many times over the limit
    const overLimitFactor = Math.ceil(record.count / maxConnections);
    
    // Log suspicious activity if significantly over limit
    if (overLimitFactor > 3) {
      logger.warn(`Suspicious WebSocket connection activity from IP ${ip}: ${record.count} attempts in ${windowMs}ms`);
    }
  }

  return {
    limited,
    resetTime: record.resetTime,
    remaining,
  };
}

/**
 * Clean up expired rate limit records
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  
  // Remove expired records
  for (const [ip, record] of connectionStore.entries()) {
    if (record.resetTime <= now) {
      connectionStore.delete(ip);
    }
  }
}

// Set up periodic cleanup
setInterval(cleanupRateLimitStore, 10 * 60 * 1000); // Clean up every 10 minutes
