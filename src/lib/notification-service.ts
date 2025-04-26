import { prisma } from '@/lib/prisma';
import { Notification } from '@prisma/client';
import { REDIS_CHANNELS, getRedisClient } from './redis';
import { logger } from '@/lib/logger';
import { createNotification as createNotificationExternal, queueNotification as queueNotificationExternal } from './notification-service-client';

/**
 * Parameters for creating a notification
 */
export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  content?: Record<string, any>;
}

/**
 * Create a notification and deliver it to the user
 */
export async function createNotification(params: CreateNotificationParams): Promise<Notification> {
  const { userId, type, title, message, content } = params;

  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
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
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
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
            type: 'delete',
            id: notificationId,
          })
        );
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
 * Get notifications for a user
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

    // Build where clause
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (typeof read === 'boolean') {
      where.read = read;
    }

    // Get total count
    const total = await prisma.notification.count({ where });

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Return notifications without content processing
    // since the content field is not stored in the database
    const processedNotifications = notifications.map(notification => {
      return {
        ...notification,
        content: null, // No content field in the database model
      };
    });

    return {
      notifications: processedNotifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Failed to get notifications:', error);
    throw error;
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
