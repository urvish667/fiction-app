/**
 * Redis client utility for FableSpace
 *
 * This module provides a Redis client for use across the application.
 * It handles connection management, error handling, and provides
 * utility functions for common Redis operations.
 *
 * IMPORTANT: This is a singleton that should be used throughout the application.
 * Do not create new Redis instances elsewhere.
 */

import { Redis, RedisOptions } from 'ioredis';
import { logger } from '@/lib/logger';

// Global variable to track connection status to prevent excessive logging
let connectionWarningLogged = false;

// Redis client options
export const REDIS_OPTIONS: RedisOptions = {
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
  // Add connection stability options
  connectTimeout: 10000, // 10 seconds
  keepAlive: 10000, // 10 seconds
  // Disable auto-reconnect cycling
  autoResubscribe: false,
  autoResendUnfulfilledCommands: false,
  // Add connection pool options
  connectionName: 'fablespace-main'
};

// Redis client singleton - use a WeakMap to ensure garbage collection
const globalRedisClient = global as unknown as {
  redisClient: Redis | null;
};

// Initialize the global Redis client if it doesn't exist
if (!globalRedisClient.redisClient) {
  globalRedisClient.redisClient = null;
}

/**
 * Create a Redis client
 * @returns A Redis client or null if not configured
 */
export function createRedisClient(): Redis | null {
  // Check if Redis URL is configured
  const redisUrl = process.env.REDIS_URL;
  let client: Redis | null = null;

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

      if (!connectionWarningLogged) {
        logger.info(`Constructed Redis URL from components: ${host}:${port}`);
        connectionWarningLogged = true;
      }

      try {
        // Create Redis client with constructed URL
        client = new Redis(constructedUrl, REDIS_OPTIONS);
      } catch (error) {
        logger.error('Failed to create Redis client with constructed URL:', error);
        return null;
      }
    } else {
      if (!connectionWarningLogged) {
        logger.warn('Redis configuration is incomplete. REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD are required.');
        connectionWarningLogged = true;
      }
      return null;
    }
  } else {
    try {
      // Create Redis client with provided URL
      if (!connectionWarningLogged) {
        logger.info(`Creating Redis client with URL: ${redisUrl.split('@').pop()}`); // Log only the host part for security
        connectionWarningLogged = true;
      }
      client = new Redis(redisUrl, REDIS_OPTIONS);
    } catch (error) {
      logger.error('Failed to create Redis client:', error);
      return null;
    }
  }

  // Set up event handlers if client was created
  if (client) {
    setupRedisEventHandlers(client);
  }

  return client;
}

/**
 * Set up event handlers for Redis client
 * @param client The Redis client
 */
function setupRedisEventHandlers(client: Redis): void {
  // Handle connection events
  client.on('connect', () => {
    logger.info('Redis client connected');
    connectionWarningLogged = false; // Reset warning flag on successful connection
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
    // Only log reconnection attempts if we haven't logged too many
    if (!connectionWarningLogged) {
      logger.info('Redis client reconnecting');
      connectionWarningLogged = true;
    }
  });

  client.on('end', () => {
    logger.warn('Redis client connection ended');
    // Reset the global client when the connection ends
    if (globalRedisClient.redisClient === client) {
      globalRedisClient.redisClient = null;
    }
  });
}

/**
 * Get the Redis client instance
 * @returns The Redis client instance or null if not configured
 */
export function getRedisClient(): Redis | null {
  if (!globalRedisClient.redisClient) {
    globalRedisClient.redisClient = createRedisClient();
  }

  // Check if the client is still connected
  if (globalRedisClient.redisClient && !globalRedisClient.redisClient.status.includes('connect')) {
    // If the client is disconnected, create a new one
    closeRedisConnection().catch(err => logger.error('Error closing Redis connection:', err));
    globalRedisClient.redisClient = createRedisClient();
  }

  return globalRedisClient.redisClient;
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
  if (globalRedisClient.redisClient) {
    try {
      await globalRedisClient.redisClient.quit();
    } catch (error) {
      logger.error('Error quitting Redis client:', error);
    } finally {
      globalRedisClient.redisClient = null;
    }
  }
}

// Export the Redis client singleton
export const redis = getRedisClient();
