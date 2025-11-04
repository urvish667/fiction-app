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

// Health check interval
let healthCheckInterval: NodeJS.Timeout | null = null;

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
  try {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;
    const password = process.env.REDIS_PASSWORD;
    const tls = process.env.REDIS_TLS === 'true';

    let client: Redis | null = null;

    if (host && port && password) {
      // Construct Redis URL
      const protocol = tls ? 'rediss' : 'redis';
      const constructedUrl = `${protocol}://:${password}@${host}:${port}`;

      if (!connectionWarningLogged) {
        logger.info(`Creating Redis client with components: ${host}:${port}`);
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

    // Set up event handlers if client was created
    if (client) {
      setupRedisEventHandlers(client);
    }

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
  try {
    // Check if Redis is disabled
    if (process.env.REDIS_ENABLED === 'false') {
      return null;
    }

    // Create client if it doesn't exist
    if (!globalRedisClient.redisClient) {
      globalRedisClient.redisClient = createRedisClient();
    }

    // Check if the client is still connected
    if (globalRedisClient.redisClient) {
      try {
        const status = globalRedisClient.redisClient.status;
        // Treat these as healthy statuses; do not force reconnects when healthy
        const healthyStatuses = ['ready', 'connect', 'connecting', 'reconnecting'];
        if (!healthyStatuses.includes(status)) {
          // If the client is disconnected/unhealthy, create a new one
          logger.warn(`Redis client status is ${status}, attempting to reconnect`);
          closeRedisConnection().catch(err => logger.error('Error closing Redis connection:', err));
          globalRedisClient.redisClient = createRedisClient();
        }
      } catch (statusError) {
        // If we can't check the status, assume it's disconnected
        logger.error('Error checking Redis connection status:', statusError);
        closeRedisConnection().catch(err => logger.error('Error closing Redis connection:', err));
        globalRedisClient.redisClient = createRedisClient();
      }
    }

    return globalRedisClient.redisClient;
  } catch (error) {
    // If there's any error in the Redis client management, log and return null
    logger.error('Error in Redis client management:', error);
    return null;
  }
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

/**
 * Start Redis health check
 * @param intervalMs Interval in milliseconds between health checks
 */
export function startRedisHealthCheck(intervalMs: number = 30000): void {
  try {
    // Check if Redis is disabled
    if (process.env.REDIS_ENABLED === 'false') {
      logger.info('Redis is disabled, not starting health check');
      return;
    }

    // Clear existing interval if any
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }

    // Set up new health check interval
    healthCheckInterval = setInterval(async () => {
      try {
        const client = getRedisClient();
        if (client) {
          try {
            // Ping Redis to check connection
            const pongResponse = await client.ping();
            if (pongResponse === 'PONG') {
              logger.debug('Redis health check: OK');
            } else {
              logger.warn(`Redis health check: Unexpected response: ${pongResponse}`);
              // Force reconnection on next getRedisClient call
              await closeRedisConnection().catch(err => logger.error('Error closing Redis connection:', err));
              globalRedisClient.redisClient = null;
            }
          } catch (pingError) {
            logger.error('Redis health check ping failed:', pingError);
            // Force reconnection on next getRedisClient call
            await closeRedisConnection().catch(err => logger.error('Error closing Redis connection:', err));
            globalRedisClient.redisClient = null;
          }
        } else {
          logger.debug('Redis health check: No client available');
        }
      } catch (checkError) {
        logger.error('Error in Redis health check:', checkError);
      }
    }, intervalMs);

    logger.info(`Redis health check started with interval of ${intervalMs}ms`);
  } catch (error) {
    logger.error('Failed to start Redis health check:', error);
  }
}

/**
 * Stop Redis health check
 */
export function stopRedisHealthCheck(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('Redis health check stopped');
  }
}

/**
 * Initialize Redis
 * This function initializes Redis and starts the health check if enabled
 */
export function initializeRedis(): void {
  try {
    // Check if Redis is disabled
    if (process.env.REDIS_ENABLED === 'false') {
      logger.info('Redis is disabled, skipping initialization');
      return;
    }

    // Initialize Redis client
    const client = getRedisClient();
    if (client) {
      logger.info('Redis client initialized successfully');
    } else {
      logger.warn('Failed to initialize Redis client');
    }

    // Start health check if enabled
    if (process.env.REDIS_HEALTH_CHECK_ENABLED === 'true') {
      const interval = parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL || '30000', 10);
      startRedisHealthCheck(interval);
    }
  } catch (error) {
    logger.error('Error initializing Redis:', error);
  }
}

// Export the Redis client singleton getter function
// This is safer than exporting the client directly
export const redis = getRedisClient();

// Initialize Redis
initializeRedis();
