import { prisma } from '@/lib/prisma';
import { Notification } from '@prisma/client';
import { redis, REDIS_CHANNELS } from './redis';
import { logger } from '@/lib/logger';
import { notificationQueue, inMemoryQueue } from './notification-queue';
import { sendToUser } from './websocket';

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
 * Initialize the notification system
 */
export function initNotificationSystem(): void {
  // Initialize notification queue with processor
  notificationQueue.initNotificationQueue(async (job) => {
    return await createNotification(job.data);
  });

  // Set processor for in-memory queue (fallback)
  inMemoryQueue.setProcessor(async (job) => {
    return await createNotification(job.data);
  });

  logger.info('Notification system initialized');
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
        content: content ? JSON.stringify(content) : null,
      },
    });

    // Increment unread notifications count
    await prisma.user.update({
      where: { id: userId },
      data: {
        unreadNotifications: { increment: 1 },
      },
    });

    // Publish notification to Redis for real-time delivery
    if (redis) {
      try {
        const notificationData = {
          ...notification,
          content: content || null,
        };

        await redis.publish(
          REDIS_CHANNELS.NOTIFICATIONS,
          JSON.stringify({
            userId,
            notification: notificationData,
          })
        );

        logger.debug(`Published notification to Redis channel: ${REDIS_CHANNELS.NOTIFICATIONS}`);
      } catch (error) {
        logger.error('Failed to publish notification to Redis:', error);
      }
    } else {
      // Fallback to direct WebSocket delivery if Redis is not available
      try {
        sendToUser(userId, {
          type: 'notification',
          data: {
            ...notification,
            content: content || null,
          },
        });
      } catch (error) {
        logger.error('Failed to send notification via WebSocket:', error);
      }
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

    // Publish update to Redis for real-time delivery
    if (redis) {
      try {
        await redis.publish(
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

    // Publish update to Redis for real-time delivery
    if (redis) {
      try {
        await redis.publish(
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

    // Process content field for each notification
    const processedNotifications = notifications.map(notification => {
      let content = null;

      if (notification.content) {
        try {
          content = JSON.parse(notification.content as string);
        } catch (error) {
          logger.error(`Failed to parse notification content for ID ${notification.id}:`, error);
        }
      }

      return {
        ...notification,
        content,
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
    // Try to use BullMQ queue
    const jobId = await notificationQueue.addToQueue(params, delay);

    // Fall back to in-memory queue if BullMQ is not available
    if (!jobId) {
      logger.warn('Using in-memory queue for notification');
      inMemoryQueue.enqueue(params, delay);
    }
  } catch (error) {
    logger.error('Failed to queue notification:', error);

    // Fall back to in-memory queue on error
    inMemoryQueue.enqueue(params, delay);
  }
}

// Initialize notification system
if (typeof window === 'undefined') {
  initNotificationSystem();
}
