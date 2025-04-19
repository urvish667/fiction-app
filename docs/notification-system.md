# Local Notification System Implementation

This document outlines the implementation of a production-ready notification system that works locally without external dependencies like Redis or BullMQ, while being designed for easy transition to a cloud setup later.

## Architecture Overview

The notification system consists of:

1. **Database Layer**: Using PostgreSQL via Prisma
2. **API Layer**: REST endpoints for CRUD operations
3. **Queue Layer**: In-memory queue for delayed processing
4. **Client Layer**: React components and hooks with polling for updates

## 1. Database Layer

We'll use the existing Prisma model:

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([read])
  @@index([createdAt])
}
```

## 2. API Layer

We'll enhance the existing API endpoints:

- `GET /api/notifications` - Fetch notifications with filtering and pagination
- `PUT /api/notifications/mark-read` - Mark notifications as read
- `DELETE /api/notifications/:id` - Delete a notification
- `POST /api/notifications/test` - Create a test notification (for development)

## 3. Client-Side Polling

Since WebSockets are not directly supported in Next.js App Router, we'll use polling for updates:

```typescript
// src/hooks/useNotifications.ts (excerpt)

// Set up polling for notifications
useEffect(() => {
  // Skip polling if using mock data
  if (useMockData) return;

  // Poll for new notifications every 15 seconds
  const pollInterval = setInterval(() => {
    fetchNotifications();
  }, 15000); // 15 seconds

  // Clean up on unmount
  return () => {
    clearInterval(pollInterval);
  };
}, [useMockData, fetchNotifications]);
```

### Real-Time Options for Production

For a production environment, consider these options for real-time notifications:

1. **Dedicated WebSocket Server**: Run a separate WebSocket server alongside your Next.js application
2. **Managed Services**: Use services like Pusher, Socket.io, or Ably
3. **Server-Sent Events (SSE)**: For one-way real-time updates from server to client
4. **Enhanced Polling**: Implement smart polling with exponential backoff

## 4. Queue Layer

We'll implement a simple in-memory queue for delayed processing:

```typescript
// src/lib/notification-queue.ts
type QueueTask = () => Promise<void>;

class NotificationQueue {
  private queue: QueueTask[] = [];
  private processing = false;

  enqueue(task: QueueTask) {
    this.queue.push(task);
    this.processQueue();
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    } catch (error) {
      console.error('Error processing notification task:', error);
    } finally {
      this.processing = false;

      // Process next task if available
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }
}

export const notificationQueue = new NotificationQueue();
```

## 5. Notification Service

We'll create a service to handle notification creation and delivery:

```typescript
// src/lib/notification-service.ts
import { prisma } from '@/lib/prisma';
import { emitNotification } from '@/lib/socket-server';
import { notificationQueue } from '@/lib/notification-queue';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, data } = params;

  // Create notification in database
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
    },
  });

  // Increment unread count
  await prisma.user.update({
    where: { id: userId },
    data: { unreadNotifications: { increment: 1 } },
  });

  // Emit real-time notification
  emitNotification(userId, notification);

  return notification;
}

// Queue a notification for delayed delivery
export function queueNotification(params: CreateNotificationParams, delayMs = 0) {
  const task = async () => {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    await createNotification(params);
  };

  notificationQueue.enqueue(task);
}
```

## 6. Client Integration

We'll update the useNotifications hook to support polling for updates:

```typescript
// src/hooks/useNotifications.ts (excerpt)
import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationResponse, mockNotifications } from '@/types/notification';

export function useNotifications({ useMockData = false, initialType = 'all' } = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialType);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (useMockData) {
      // Use mock data
      setNotifications(mockNotifications as any);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query parameters based on active tab
      let queryParams = new URLSearchParams();

      if (activeTab === "unread") {
        queryParams.append("read", "false");
      } else if (activeTab !== "all") {
        queryParams.append("type", activeTab);
      }

      const response = await fetch(`/api/notifications?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data: NotificationResponse = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, useMockData]);

  // Set up polling for notifications
  useEffect(() => {
    // Skip polling if using mock data
    if (useMockData) return;

    // Poll for new notifications every 15 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 15000); // 15 seconds

    // Clean up on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [useMockData, fetchNotifications]);

  // Rest of the hook implementation...
}
```

## 7. Testing Utilities

We'll add a test endpoint to create notifications for development:

```typescript
// src/app/api/notifications/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createNotification, queueNotification } from '@/lib/notification-service';
import { z } from 'zod';

const testNotificationSchema = z.object({
  type: z.string(),
  title: z.string().optional(),
  message: z.string().optional(),
  data: z.record(z.any()).optional(),
  delay: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test endpoint not available in production' },
        { status: 403 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = testNotificationSchema.parse(body);

    const { type, delay = 0 } = validatedData;

    // Generate title and message based on type if not provided
    let title = validatedData.title || `Test ${type} Notification`;
    let message = validatedData.message || `This is a test ${type} notification`;

    // Create notification
    if (delay > 0) {
      queueNotification({
        userId: session.user.id,
        type,
        title,
        message,
        data: validatedData.data,
      }, delay);

      return NextResponse.json({
        message: `Test notification queued with ${delay}ms delay`,
      });
    } else {
      const notification = await createNotification({
        userId: session.user.id,
        type,
        title,
        message,
        data: validatedData.data,
      });

      return NextResponse.json({
        message: 'Test notification created',
        notification,
      });
    }
  } catch (error) {
    console.error('Error creating test notification:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}
```

## 8. Transition to Cloud

When ready to move to a cloud environment:

1. **Real-Time Notifications**:
   - Implement WebSockets using a dedicated server or service like Pusher, Socket.io, or Ably
   - Consider Server-Sent Events (SSE) for one-way real-time updates

2. **Queue System**:
   - Replace the in-memory queue with BullMQ, AWS SQS, or similar
   - Implement proper error handling and retry mechanisms

3. **Scaling**:
   - Use Redis for shared state across multiple instances
   - Implement proper database indexing for notification queries

4. **Monitoring and Logging**:
   - Add monitoring for notification delivery
   - Implement logging for debugging and analytics

5. **Additional Channels**:
   - Add email notifications
   - Implement push notifications for mobile devices

## Implementation Steps

1. Create the notification service with database integration
2. Implement the in-memory queue for delayed notifications
3. Create REST API endpoints for CRUD operations
4. Update the useNotifications hook with polling
5. Add the test endpoint for development
6. Create UI components for displaying notifications
7. Test the system end-to-end
