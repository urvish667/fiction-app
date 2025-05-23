# Notification System Usage Guide

This guide explains how to use the notification system in the FableSpace application.

## Overview

The notification system provides notifications to users through a combination of:

1. Database storage (PostgreSQL via Prisma)
2. REST API endpoints with polling for updates
3. In-memory queue for delayed processing

## Creating Notifications

To create a notification, use the `createNotification` function from the notification service:

```typescript
import { createNotification } from '@/lib/notification-service';

await createNotification({
  userId: 'user-id',
  type: 'like',
  title: 'New Like',
  message: 'Someone liked your story',
  content: {
    storyId: 'story-id',
    storyTitle: 'Story Title',
  },
});
```

### Notification Types

The system supports the following notification types:

- `like` - When someone likes a story
- `comment` - When someone comments on a story
- `follow` - When someone follows a user
- `chapter` - When an author publishes a new chapter
- `donation` - When someone donates to an author

### Delayed Notifications

To create a notification with a delay, use the `queueNotification` function:

```typescript
import { queueNotification } from '@/lib/notification-service';

queueNotification({
  userId: 'user-id',
  type: 'like',
  title: 'New Like',
  message: 'Someone liked your story',
  content: {
    storyId: 'story-id',
    storyTitle: 'Story Title',
  },
}, 5000); // 5 second delay
```

## API Endpoints

The system provides the following API endpoints:

### GET /api/notifications

Retrieves notifications for the current user.

Query parameters:
- `page` - Page number (default: 1)
- `limit` - Number of notifications per page (default: 20)
- `type` - Filter by notification type
- `read` - Filter by read status (true/false)

### PUT /api/notifications/mark-read

Marks notifications as read.

Request body:
- `ids` - Array of notification IDs to mark as read
- `all` - Boolean to mark all notifications as read

### DELETE /api/notifications/:id

Deletes a notification.

### POST /api/notifications/test (Development Only)

Creates a test notification.

Request body:
- `type` - Notification type
- `title` - Notification title (optional)
- `message` - Notification message (optional)
- `content` - Additional content (optional)
- `delay` - Delay in milliseconds (optional)

## Real-Time Updates

The system uses a hybrid approach for real-time updates with page visibility awareness:

1. **WebSockets (Primary)**: When available, WebSockets provide true real-time updates
2. **Polling (Fallback)**: If WebSockets are not connected, the system falls back to polling every 60 seconds
3. **Page Visibility**: Both WebSockets and polling respect page visibility:
   - When the page is hidden (tab not active), polling is paused
   - When the page becomes visible again, notifications are fetched immediately
   - WebSocket connections and reconnections are managed based on page visibility

This approach balances real-time updates with server performance, connection stability, and battery life.

## React Hook

Use the `useNotifications` hook to access notifications in React components:

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
    notifications,
    filteredNotifications,
    loading,
    error,
    activeTab,
    setActiveTab,
    markAsReadAndDelete,

  } = useNotifications();

  // ...
}
```

## Testing Notifications

In development mode, you can use the `NotificationTester` component to send test notifications:

```tsx
import { NotificationTester } from '@/components/notification-tester';

function MyComponent() {
  return (
    <div>
      <NotificationTester />
    </div>
  );
}
```

## Upgrading to Production

When moving to production, consider the following upgrades:

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
