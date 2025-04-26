# FableSpace Notification Service

This document explains the notification service architecture and how to use it.

## Overview

The FableSpace notification system has been separated into a standalone service to improve scalability and maintainability. The notification service handles:

1. Real-time notifications via WebSockets
2. Delayed notifications via BullMQ and Redis
3. Notification queue management

## Architecture

The notification system consists of:

1. **Main Application**: Creates notifications in the database and publishes events to Redis
2. **Notification Service**: Listens for Redis events and delivers notifications to clients via WebSockets
3. **Redis**: Acts as a message broker between the main application and notification service
4. **Client**: Connects to the notification service via WebSockets to receive real-time updates

## Components

### 1. Redis Client

The Redis client provides a connection to Redis for pub/sub messaging and queue management. It's used by both the main application and the notification service.

### 2. WebSocket Server

The WebSocket server handles real-time communication with clients. It authenticates clients using JWT tokens and routes messages to the appropriate clients.

### 3. Notification Queue

The notification queue uses BullMQ with Redis for delayed processing. It provides job queuing with delay, retry mechanisms, and error handling.

### 4. Notification Service Client

The notification service client is used by the main application to interact with the notification service. It handles sending notifications and queuing delayed notifications.

## Setup

### Environment Variables

Add the following variables to your `.env` file:

```
# Redis Configuration - Option 1: Using URL
REDIS_URL=rediss://:your-password@fablespace-test-redis.redis.cache.windows.net:6380

# Redis Configuration - Option 2: Using individual components
REDIS_HOST=fablespace-test-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your-password
REDIS_TLS=true

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3001/api/ws
WS_PORT=3001

# JWT Configuration
JWT_ENCRYPTION_KEY=your-jwt-encryption-key
```

### Starting the Notification Service

In development:

```bash
npm run notification:start
```

In production with Docker:

```bash
docker-compose up -d notification-service
```

## Usage

### Creating Notifications

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

### Queuing Delayed Notifications

```typescript
import { queueNotification } from '@/lib/notification-service';

await queueNotification({
  userId: 'user-id',
  type: 'reminder',
  title: 'Reminder',
  message: 'Don\'t forget to finish your story',
  content: {
    storyId: 'story-id',
    storyTitle: 'Story Title',
  },
}, 3600000); // 1 hour delay
```

### Client-Side Integration

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function NotificationsComponent() {
  const {
    notifications,
    loading,
    error,
    markAsRead,
    deleteNotification,
    wsStatus,
  } = useNotifications();

  // Render notifications
}
```

## Deployment

The notification service can be deployed in several ways:

1. **Same Server**: Run the notification service on the same server as the main application
2. **Separate Server**: Deploy the notification service on a dedicated server
3. **Docker**: Use Docker Compose to deploy both services together

### Docker Deployment

```bash
docker-compose up -d
```

This will start both the main application and the notification service.

## Scaling

For scaling the notification system:

1. **Horizontal Scaling**: Deploy multiple instances of the notification service behind a load balancer
2. **Redis Cluster**: Use Redis Cluster for high availability and scalability
3. **WebSocket Clustering**: Use sticky sessions or a shared state store for WebSocket clustering
