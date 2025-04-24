# Redis-based Notification System

This document outlines the implementation of the Redis-based notification system with WebSockets for real-time updates.

## Architecture Overview

The notification system consists of:

1. **Database Layer**: PostgreSQL via Prisma for persistent storage
2. **Queue Layer**: BullMQ with Redis for delayed processing
3. **Pub/Sub Layer**: Redis for real-time notifications
4. **WebSocket Layer**: Custom WebSocket server for client connections
5. **Client Layer**: React hooks with WebSocket and polling fallback

## Components

### 1. Redis Client (src/lib/redis.ts)

The Redis client provides a singleton instance for use across the application. It handles:

- Connection management
- Error handling
- Pub/Sub channels
- Key prefixes

### 2. Notification Queue (src/lib/notification-queue.ts)

The notification queue uses BullMQ with Redis for delayed processing. It provides:

- Job queuing with delay
- Retry mechanisms
- Error handling
- Fallback to in-memory queue when Redis is unavailable

### 3. Notification Service (src/lib/notification-service.ts)

The notification service handles the business logic for notifications:

- Creating notifications in the database
- Publishing notifications to Redis
- Queuing notifications for delayed delivery
- Marking notifications as read
- Deleting notifications

### 4. WebSocket Server (src/lib/websocket.ts)

The WebSocket server handles real-time communication with clients:

- Client connections with authentication
- Message routing
- Redis subscription
- Error handling

### 5. WebSocket Client (src/lib/client/websocket-client.ts)

The WebSocket client handles the browser-side connection:

- Connection management
- Reconnection logic
- Message handling
- Status tracking

### 6. Notification Hook (src/hooks/useNotifications.ts)

The notification hook provides a React interface for the notification system:

- WebSocket connection with authentication
- Polling fallback
- Local state management
- CRUD operations

## Setup and Configuration

### Environment Variables

```
# Redis Configuration - Option 1: Using URL
REDIS_URL=rediss://:your-password@fablespace-test-redis.redis.cache.windows.net:6380
QUEUE_REDIS_ENABLED=true

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

Note: For Azure Redis Cache, use the `rediss://` protocol (Redis over SSL) instead of `redis://`.

### Starting the WebSocket Server

```bash
npm run ws:start
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

### Delayed Notifications

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

### Using the Notification Hook

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function NotificationsPage() {
  const {
    notifications,
    filteredNotifications,
    groupedNotifications,
    hasNotifications,
    loading,
    error,
    activeTab,
    setActiveTab,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    wsStatus,
  } = useNotifications();

  // ...
}
```

## Testing

### Test Notification Endpoint

The system includes a test endpoint for creating notifications:

```
POST /api/notifications/test
```

Request body:
```json
{
  "type": "like",
  "title": "Test Notification",
  "message": "This is a test notification",
  "content": {
    "storyId": "123",
    "storyTitle": "Test Story"
  },
  "delay": 0
}
```

## Deployment Considerations

### WebSocket Server

The WebSocket server should be deployed as a separate service. Options include:

1. **Same Server**: Run the WebSocket server on the same server as the Next.js application
2. **Separate Server**: Deploy the WebSocket server on a dedicated server
3. **Managed Service**: Use a managed WebSocket service like Pusher, Socket.io, or similar

### Redis

Redis should be deployed as a managed service for production. Options include:

1. **Azure Cache for Redis**: Used in this implementation
2. **AWS ElastiCache**: Alternative for AWS deployments
3. **Redis Cloud**: Managed Redis service

### Scaling

For scaling the notification system:

1. **Multiple WebSocket Servers**: Use Redis to coordinate between multiple WebSocket servers
2. **Load Balancing**: Use a load balancer for WebSocket connections
3. **Sharding**: Shard notifications by user ID for large-scale deployments
