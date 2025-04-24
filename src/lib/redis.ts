/**
 * Redis client utility for FableSpace
 *
 * This module provides a Redis client for use across the application.
 * It handles connection management, error handling, and provides
 * utility functions for common Redis operations.
 */

import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';

// Redis client options
const REDIS_OPTIONS = {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    // Exponential backoff with max 1 second
    return Math.min(times * 100, 1000);
  },
  enableReadyCheck: true,
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  },
};

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Create a Redis client
 * @returns A Redis client or null if not configured
 */
export function createRedisClient(): Redis | null {
  // Check if Redis URL is configured
  const redisUrl = process.env.REDIS_URL;

  // If no Redis URL, try to construct one from individual components
  if (!redisUrl) {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;
    const password = process.env.REDIS_PASSWORD;
    const tls = process.env.REDIS_TLS === 'true';

    if (host && port && password) {
      // Construct Redis URL
      const protocol = tls ? 'rediss' : 'redis';
      const constructedUrl = `${protocol}://:${password}@${host}:${port}`;
      logger.info(`Constructed Redis URL from components: ${host}:${port}`);

      try {
        // Create Redis client with constructed URL
        const client = new Redis(constructedUrl, REDIS_OPTIONS);
        setupRedisEventHandlers(client);
        return client;
      } catch (error) {
        logger.error('Failed to create Redis client with constructed URL:', error);
        return null;
      }
    } else {
      logger.warn('Redis configuration is incomplete. REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD are required.');
      return null;
    }
  }

  try {
    // Create Redis client with provided URL
    logger.info(`Creating Redis client with URL: ${redisUrl.split('@').pop()}`); // Log only the host part for security
    const client = new Redis(redisUrl, REDIS_OPTIONS);
    setupRedisEventHandlers(client);
    return client;
  } catch (error) {
    logger.error('Failed to create Redis client:', error);
    return null;
  }
}

/**
 * Set up event handlers for Redis client
 * @param client The Redis client
 */
function setupRedisEventHandlers(client: Redis): void {
  // Handle connection events
  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('error', (error) => {
    logger.error('Redis client error:', error);
  });

  client.on('close', () => {
    logger.info('Redis client connection closed');
  });

  client.on('reconnecting', () => {
    logger.info('Redis client reconnecting');
  });
}

/**
 * Get the Redis client instance
 * @returns The Redis client instance or null if not configured
 */
export function getRedisClient(): Redis | null {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

/**
 * Redis pub/sub channels
 */
export const REDIS_CHANNELS = {
  NOTIFICATIONS: 'notifications',
};

/**
 * Redis key prefixes
 */
export const REDIS_KEYS = {
  NOTIFICATION_QUEUE: 'notification:queue:',
  USER_NOTIFICATIONS: 'user:notifications:',
};

/**
 * Create a Redis key with prefix
 * @param prefix The key prefix
 * @param id The key identifier
 * @returns The full Redis key
 */
export function createRedisKey(prefix: string, id: string): string {
  return `${prefix}${id}`;
}

/**
 * Close the Redis client connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Export the Redis client singleton
export const redis = getRedisClient();
