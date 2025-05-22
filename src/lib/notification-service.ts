import { prisma } from '@/lib/prisma';
import { Notification } from '@prisma/client';
import { REDIS_CHANNELS, getRedisClient } from './redis';
import { logger } from '@/lib/logger';
import { createNotification as createNotificationExternal, queueNotification as queueNotificationExternal } from './notification-service-client';
import {
  CreateNotificationParams,
  NotificationType,
  EnhancedNotification,
  NotificationContent
} from '@/types/notification-types';

/**
 * Create a notification and deliver it to the user
 */
export async function createNotification(params: CreateNotificationParams): Promise<Notification> {
  const { userId, type, title, message, content, actorId } = params;

  try {
    // Check rate limit before creating notification
    if (process.env.NOTIFICATION_RATE_LIMIT_ENABLED === 'true') {
      const withinLimit = await checkNotificationRateLimit(userId, type);
      if (!withinLimit) {
        logger.warn(`Notification rate limit exceeded for user ${userId}, type ${type}. Skipping notification creation.`);
        throw new Error('Notification rate limit exceeded');
      }
    }

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        content: content ? JSON.parse(JSON.stringify(content)) : null,
        actorId,
      },
    });

    // Increment unread notifications count
    await prisma.user.update({
      where: { id: userId },
      data: {
        unreadNotifications: { increment: 1 },
      },
    });

    // Send to notification service via Redis
    try {
      // Add the content field for the external notification service
      // This field is not stored in the database but is needed by the external service
      const notificationData = {
        ...notification,
        content: content || null, // Add content for external service
      };

      // Get the Redis client from the global singleton
      const redisClient = getRedisClient();

      // Publish to Redis for the external notification service to pick up
      if (redisClient) {
        await redisClient.publish(
          REDIS_CHANNELS.NOTIFICATIONS,
          JSON.stringify({
            userId,
            notification: notificationData,
          })
        );

        // Add detailed log for comment notifications to verify Redis usage
        if (type === 'comment') {
          logger.info(`REDIS PUB/SUB: Comment notification for user ${userId} published to Redis channel: ${REDIS_CHANNELS.NOTIFICATIONS}`);
          logger.info(`REDIS PUB/SUB DATA: ${JSON.stringify({
            userId,
            notificationType: type,
            title,
            hasContent: !!content
          })}`);
        } else {
          logger.debug(`Published notification to Redis channel: ${REDIS_CHANNELS.NOTIFICATIONS}`);
        }

        // Invalidate cache for this user
        if (process.env.NOTIFICATION_CACHE_ENABLED === 'true') {
          try {
            // Delete all notification list caches for this user
            const pattern = `${REDIS_KEYS.USER_NOTIFICATIONS}${userId}:*`;
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
              await redisClient.del(...keys);
              logger.debug(`Invalidated ${keys.length} notification cache keys for user ${userId}`);
            }

            // Delete unread count cache
            await redisClient.del(`user:unread_count:${userId}`);
          } catch (cacheError) {
            logger.warn('Failed to invalidate notification caches:', cacheError);
          }
        }
      } else {
        logger.warn('Redis client not available for notification delivery');
      }
    } catch (error) {
      logger.error('Failed to publish notification to Redis:', error);
    }

    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(userId: string, notificationIds?: string[]) {
  try {
    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
        },
        data: { read: true },
      });
    } else {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: { read: true },
      });
    }

    // Reset unread notifications count
    await prisma.user.update({
      where: { id: userId },
      data: { unreadNotifications: 0 },
    });

    // Get the Redis client from the global singleton
    const redisClient = getRedisClient();

    // Publish update to Redis for real-time delivery
    if (redisClient) {
      try {
        await redisClient.publish(
          REDIS_CHANNELS.NOTIFICATIONS,
          JSON.stringify({
            userId,
            type: 'mark_read',
            ids: notificationIds || 'all',
          })
        );

        // Invalidate cache for this user
        if (process.env.NOTIFICATION_CACHE_ENABLED === 'true') {
          try {
            // Delete all notification list caches for this user
            const pattern = `${REDIS_KEYS.USER_NOTIFICATIONS}${userId}:*`;
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
              await redisClient.del(...keys);
              logger.debug(`Invalidated ${keys.length} notification cache keys for user ${userId}`);
            }

            // Delete unread count cache
            await redisClient.del(`user:unread_count:${userId}`);
          } catch (cacheError) {
            logger.warn('Failed to invalidate notification caches:', cacheError);
          }
        }
      } catch (error) {
        logger.error('Failed to publish mark-read event to Redis:', error);
      }
    }
  } catch (error) {
    logger.error('Failed to mark notifications as read:', error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(userId: string, notificationId: string) {
  try {
    // Check if notification is unread before deleting
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: {
        read: true,
      },
    });

    // Delete the notification
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    // If notification was unread, decrement the unread count
    if (notification && !notification.read) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          unreadNotifications: {
            decrement: 1,
          },
        },
      });
    }

    // Get the Redis client from the global singleton
    const redisClient = getRedisClient();

    // Publish update to Redis for real-time delivery
    if (redisClient) {
      try {
        await redisClient.publish(
          REDIS_CHANNELS.NOTIFICATIONS,
          JSON.stringify({
            userId,
            type: 'delete',
            id: notificationId,
          })
        );

        // Invalidate cache for this user
        if (process.env.NOTIFICATION_CACHE_ENABLED === 'true') {
          try {
            // Delete all notification list caches for this user
            const pattern = `${REDIS_KEYS.USER_NOTIFICATIONS}${userId}:*`;
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
              await redisClient.del(...keys);
              logger.debug(`Invalidated ${keys.length} notification cache keys for user ${userId}`);
            }

            // Delete unread count cache if notification was unread
            if (notification && !notification.read) {
              await redisClient.del(`user:unread_count:${userId}`);
            }
          } catch (cacheError) {
            logger.warn('Failed to invalidate notification caches:', cacheError);
          }
        }
      } catch (error) {
        logger.error('Failed to publish delete event to Redis:', error);
      }
    }
  } catch (error) {
    logger.error('Failed to delete notification:', error);
    throw error;
  }
}

/**
 * Get notifications for a user with Redis caching
 */
export async function getNotifications(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    type?: string;
    read?: boolean;
  } = {}
) {
  try {
    const { page = 1, limit = 20, type, read } = options;
    const skip = (page - 1) * limit;

    // Build where clause for database query
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (typeof read === 'boolean') {
      where.read = read;
    }

    // Only try Redis if caching is explicitly enabled
    if (process.env.NOTIFICATION_CACHE_ENABLED === 'true') {
      try {
        // Create cache key based on query parameters
        const cacheKey = `${REDIS_KEYS.USER_NOTIFICATIONS}${userId}:${page}:${limit}:${type || 'all'}:${read === undefined ? 'all' : read}`;

        // Try to get from Redis cache first
        const redisClient = getRedisClient();
        if (redisClient) {
          try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
              logger.debug(`Cache hit for notifications: ${cacheKey}`);
              return JSON.parse(cachedData);
            }
          } catch (redisError) {
            // Log but continue with database query on Redis error
            logger.warn('Failed to get notifications from cache:', redisError);
          }
        }
      } catch (cacheKeyError) {
        // If there's any error in the caching logic, just log and continue
        logger.warn('Error in notification cache logic:', cacheKeyError);
      }
    }

    // Cache miss, disabled, or error - get from database
    // Get total count
    const total = await prisma.notification.count({ where });

    // Get notifications with actor information
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    });

    // Process notifications to match the expected interface
    const processedNotifications = notifications.map(notification => {
      return {
        ...notification,
        content: notification.content || null,
        actor: notification.actor || undefined,
      };
    });

    const result = {
      notifications: processedNotifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };

    // Only try to cache if explicitly enabled
    if (process.env.NOTIFICATION_CACHE_ENABLED === 'true') {
      try {
        const redisClient = getRedisClient();
        if (redisClient) {
          try {
            const cacheKey = `${REDIS_KEYS.USER_NOTIFICATIONS}${userId}:${page}:${limit}:${type || 'all'}:${read === undefined ? 'all' : read}`;
            const cacheExpiry = parseInt(process.env.NOTIFICATION_CACHE_TTL || '30', 10);
            await redisClient.set(cacheKey, JSON.stringify(result), 'EX', cacheExpiry);
            logger.debug(`Cached notifications: ${cacheKey} for ${cacheExpiry} seconds`);
          } catch (redisError) {
            // Just log Redis errors but don't let them affect the response
            logger.warn('Failed to cache notifications:', redisError);
          }
        }
      } catch (cacheError) {
        // If there's any error in the caching logic, just log it
        logger.warn('Error in notification cache storage logic:', cacheError);
      }
    }

    return result;
  } catch (error) {
    logger.error('Failed to get notifications:', error);
    // Return empty result instead of throwing to prevent API errors
    return {
      notifications: [],
      pagination: {
        total: 0,
        page: options.page || 1,
        limit: options.limit || 20,
        pages: 0,
      },
    };
  }
}

/**
 * Queue a notification for delayed delivery
 */
export async function queueNotification(params: CreateNotificationParams, delay: number = 0) {
  try {
    // Use the external notification service client
    await queueNotificationExternal(params, delay);
  } catch (error) {
    logger.error('Failed to queue notification:', error);

    // Create notification immediately as fallback
    await createNotification(params);
  }
}

/**
 * Create multiple notifications in a batch
 * This is more efficient than creating notifications one by one
 */
export async function createNotificationBatch(
  notificationParams: CreateNotificationParams[]
): Promise<Notification[]> {
  if (!notificationParams.length) {
    return [];
  }

  try {
    // Group notifications by userId for efficient processing
    const notificationsByUser = notificationParams.reduce((acc, params) => {
      if (!acc[params.userId]) {
        acc[params.userId] = [];
      }
      acc[params.userId].push(params);
      return acc;
    }, {} as Record<string, CreateNotificationParams[]>);

    const createdNotifications: Notification[] = [];

    // Process each user's notifications in a transaction
    for (const [userId, userNotifications] of Object.entries(notificationsByUser)) {
      await prisma.$transaction(async (tx) => {
        // Create all notifications for this user
        const notifications = await Promise.all(
          userNotifications.map(params =>
            tx.notification.create({
              data: {
                userId: params.userId,
                type: params.type,
                title: params.title,
                message: params.message,
                content: params.content ? JSON.parse(JSON.stringify(params.content)) : null,
                actorId: params.actorId,
              },
            })
          )
        );

        // Update unread count in a single operation
        await tx.user.update({
          where: { id: userId },
          data: {
            unreadNotifications: { increment: userNotifications.length },
          },
        });

        createdNotifications.push(...notifications);
      });
    }

    // Publish to Redis in batches by user
    const redisClient = getRedisClient();
    if (redisClient) {
      for (const [userId, userNotifications] of Object.entries(notificationsByUser)) {
        const userCreatedNotifications = createdNotifications.filter(n => n.userId === userId);

        // Add content to notifications for external service
        const notificationsWithContent = userCreatedNotifications.map((notification, index) => ({
          ...notification,
          content: userNotifications[index].content || null,
        }));

        // Publish batch to Redis
        await redisClient.publish(
          REDIS_CHANNELS.NOTIFICATIONS,
          JSON.stringify({
            userId,
            notifications: notificationsWithContent,
            isBatch: true,
          })
        );

        logger.info(`Published batch of ${notificationsWithContent.length} notifications for user ${userId}`);
      }
    }

    // Invalidate cache for affected users
    if (redisClient && process.env.NOTIFICATION_CACHE_ENABLED === 'true') {
      for (const userId of Object.keys(notificationsByUser)) {
        // Delete all notification list caches for this user
        const pattern = `${REDIS_KEYS.USER_NOTIFICATIONS}${userId}:*`;
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
          logger.debug(`Invalidated ${keys.length} notification cache keys for user ${userId}`);
        }

        // Delete unread count cache
        await redisClient.del(`user:unread_count:${userId}`);
      }
    }

    return createdNotifications;
  } catch (error) {
    logger.error('Failed to create notification batch:', error);
    throw error;
  }
}

/**
 * Check if a user has exceeded notification rate limits
 * This helps prevent notification spam
 */
export async function checkNotificationRateLimit(
  userId: string,
  type: string
): Promise<boolean> {
  const redisClient = getRedisClient();
  if (!redisClient || process.env.NOTIFICATION_RATE_LIMIT_ENABLED !== 'true') {
    return true; // Allow if Redis is not available or rate limiting is disabled
  }

  try {
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute window
    const maxNotifications = type === 'chapter' ? 5 : 20; // Different limits by type

    const key = `rate_limit:notifications:${userId}:${type}`;
    const timestamps = await redisClient.zrangebyscore(key, now - windowSize, now);

    if (timestamps.length >= maxNotifications) {
      logger.warn(`Rate limit exceeded for user ${userId} and notification type ${type}`);
      return false;
    }

    // Add current timestamp to sorted set
    await redisClient.zadd(key, now, now.toString());
    // Set expiration to clean up old data
    await redisClient.expire(key, 120); // 2 minutes

    return true;
  } catch (error) {
    logger.error('Error checking notification rate limit:', error);
    return true; // Allow on error
  }
}

/**
 * Get unread notification count for a user with Redis caching
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const cacheKey = `user:unread_count:${userId}`;

    // Try to get from Redis cache first
    const redisClient = getRedisClient();
    if (redisClient && process.env.NOTIFICATION_CACHE_ENABLED === 'true') {
      try {
        const cachedCount = await redisClient.get(cacheKey);
        if (cachedCount !== null) {
          logger.debug(`Cache hit for unread count: ${cacheKey}`);
          return parseInt(cachedCount, 10);
        }
      } catch (error) {
        logger.warn('Failed to get unread count from cache:', error);
        // Continue with database query on cache error
      }
    }

    // Cache miss or disabled, get from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { unreadNotifications: true },
    });

    const count = user?.unreadNotifications || 0;

    // Store in Redis cache with expiration (60 seconds)
    if (redisClient && process.env.NOTIFICATION_CACHE_ENABLED === 'true') {
      try {
        const cacheExpiry = parseInt(process.env.UNREAD_COUNT_CACHE_TTL || '60', 10);
        await redisClient.set(cacheKey, count.toString(), 'EX', cacheExpiry);
        logger.debug(`Cached unread count: ${cacheKey} for ${cacheExpiry} seconds`);
      } catch (error) {
        logger.warn('Failed to cache unread count:', error);
      }
    }

    return count;
  } catch (error) {
    logger.error('Failed to get unread notification count:', error);
    return 0;
  }
}
