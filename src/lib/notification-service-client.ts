/**
 * Client for the FableSpace Notification Service
 *
 * This module provides a client for interacting with the notification service.
 * It handles sending notifications and queuing delayed notifications.
 */

import { logger } from '@/lib/logger';
import { REDIS_CHANNELS, getRedisClient } from '@/lib/redis';
import { CreateNotificationParams } from '@/types/notification-types';

/**
 * Create a notification and deliver it to the user
 */
export async function createNotification(params: CreateNotificationParams): Promise<any> {
  const { userId, type, title, message, content, actorId } = params;

  try {
    // Create notification in database
    // This would normally be done by calling the database directly
    // but for now we'll just log it
    logger.info(`Creating notification for user ${userId}: ${title}`);

    // Create a mock notification object
    const notification = {
      id: `notification-${Date.now()}`,
      userId,
      type,
      title,
      message,
      content: content || null,
      actorId: actorId || null,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Get the Redis client from the global singleton
    const redisClient = getRedisClient();

    // Publish notification to Redis for real-time delivery
    if (redisClient) {
      try {
        await redisClient.publish(
          REDIS_CHANNELS.NOTIFICATIONS,
          JSON.stringify({
            userId,
            notification,
          })
        );

        logger.debug(`Published notification to Redis channel: ${REDIS_CHANNELS.NOTIFICATIONS}`);
      } catch (error) {
        logger.error('Failed to publish notification to Redis:', error);
      }
    } else {
      logger.warn('Redis client not available for notification delivery');
    }

    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Queue a notification for delayed delivery
 */
export async function queueNotification(params: CreateNotificationParams, delay: number = 0) {
  try {
    // Get the Redis client from the global singleton
    const redisClient = getRedisClient();

    // We'll use Redis to queue the notification
    if (redisClient) {
      try {
        // Add to a Redis list with a timestamp for processing
        const queueKey = `notification:queue:${params.userId}`;
        const item = JSON.stringify({
          ...params,
          timestamp: Date.now() + delay,
        });

        await redisClient.lpush(queueKey, item);
        logger.info(`Queued notification for user ${params.userId} with ${delay}ms delay`);
      } catch (error) {
        logger.error('Failed to queue notification in Redis:', error);
      }
    } else {
      logger.warn('Redis client not available for notification queueing');
    }
  } catch (error) {
    logger.error('Failed to queue notification:', error);
  }
}

export default {
  createNotification,
  queueNotification,
};
