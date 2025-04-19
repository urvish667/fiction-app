import { prisma } from '@/lib/prisma';
import { Notification } from '@prisma/client';

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

  // In a production environment, this is where you would trigger
  // real-time delivery via WebSockets, push notifications, etc.

  return notification;
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(userId: string, notificationIds?: string[]) {
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
}

/**
 * Delete a notification
 */
export async function deleteNotification(userId: string, notificationId: string) {
  await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  });
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

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

// Simple in-memory queue for notifications
// In a production environment, this would be replaced with a proper queue system like BullMQ
type QueuedNotification = {
  params: CreateNotificationParams;
  delay: number;
  createdAt: number;
};

class NotificationQueue {
  private queue: QueuedNotification[] = [];
  private timer: NodeJS.Timeout | null = null;

  enqueue(params: CreateNotificationParams, delay: number = 0) {
    this.queue.push({
      params,
      delay,
      createdAt: Date.now(),
    });

    this.processQueue();
  }

  private processQueue() {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      const now = Date.now();
      const readyNotifications: QueuedNotification[] = [];

      // Find notifications that are ready to be sent
      this.queue = this.queue.filter(item => {
        if (now - item.createdAt >= item.delay) {
          readyNotifications.push(item);
          return false;
        }
        return true;
      });

      // Process ready notifications
      readyNotifications.forEach(item => {
        createNotification(item.params).catch(err => {
          console.error('Error creating notification:', err);
        });
      });

      // Clear timer if queue is empty
      if (this.queue.length === 0) {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    }, 1000);
  }
}

export const notificationQueue = new NotificationQueue();

/**
 * Queue a notification for delayed delivery
 */
export function queueNotification(params: CreateNotificationParams, delay: number = 0) {
  notificationQueue.enqueue(params, delay);
}

// Note: WebSocket implementation has been removed
// In a production environment, you would implement real-time notifications
// using a service like Pusher, Socket.io, or a custom WebSocket server
