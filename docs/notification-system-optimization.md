# Notification System Optimization

This document outlines the optimizations made to the notification system to improve performance, scalability, and reliability.

## Overview

The notification system has been optimized in several key areas:

1. **Redis Health Checks**: Implemented automatic health checks to ensure Redis connections remain stable
2. **Notification Caching**: Added Redis caching for notification lists and unread counts
3. **Batch Processing**: Implemented batch processing for creating multiple notifications efficiently
4. **Rate Limiting**: Added rate limiting to prevent notification spam
5. **Cache Invalidation**: Implemented proper cache invalidation when notifications are created, read, or deleted
6. **NotificationBatch Model**: Added a new model to track batches of notifications for better monitoring

## Redis Health Checks

Redis connections are now monitored with periodic health checks to ensure they remain active:

```typescript
export function startRedisHealthCheck(intervalMs: number = 30000): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    const client = getRedisClient();
    if (client) {
      try {
        // Ping Redis to check connection
        await client.ping();
        logger.debug('Redis health check: OK');
      } catch (error) {
        logger.error('Redis health check failed:', error);
        // Force reconnection on next getRedisClient call
        closeRedisConnection().catch(err => logger.error('Error closing Redis connection:', err));
        globalRedisClient.redisClient = null;
      }
    }
  }, intervalMs);
}
```

Health checks can be enabled by setting the following environment variables:

```
REDIS_HEALTH_CHECK_ENABLED=true
REDIS_HEALTH_CHECK_INTERVAL=30000
```

## Notification Caching

Notifications are now cached in Redis to reduce database load:

```typescript
// Try to get from Redis cache first
const redisClient = getRedisClient();
if (redisClient && process.env.NOTIFICATION_CACHE_ENABLED === 'true') {
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.debug(`Cache hit for notifications: ${cacheKey}`);
      return JSON.parse(cachedData);
    }
  } catch (error) {
    logger.warn('Failed to get notifications from cache:', error);
    // Continue with database query on cache error
  }
}
```

Caching can be enabled by setting the following environment variables:

```
NOTIFICATION_CACHE_ENABLED=true
NOTIFICATION_CACHE_TTL=30
UNREAD_COUNT_CACHE_TTL=60
```

## Batch Processing

Creating multiple notifications is now more efficient with batch processing:

```typescript
export async function createNotificationBatch(
  notificationParams: CreateNotificationParams[]
): Promise<Notification[]> {
  // Group notifications by userId for efficient processing
  const notificationsByUser = notificationParams.reduce((acc, params) => {
    if (!acc[params.userId]) {
      acc[params.userId] = [];
    }
    acc[params.userId].push(params);
    return acc;
  }, {} as Record<string, CreateNotificationParams[]>);
  
  // Process each user's notifications in a transaction
  for (const [userId, userNotifications] of Object.entries(notificationsByUser)) {
    await prisma.$transaction(async (tx) => {
      // Create all notifications for this user
      // Update unread count in a single operation
    });
  }
}
```

## Rate Limiting

Rate limiting prevents notification spam:

```typescript
export async function checkNotificationRateLimit(
  userId: string, 
  type: string
): Promise<boolean> {
  // Different limits by notification type
  const maxNotifications = type === 'chapter' ? 5 : 20;
  
  // Check if user has exceeded limit in the time window
  const timestamps = await redisClient.zrangebyscore(key, now - windowSize, now);
  if (timestamps.length >= maxNotifications) {
    return false;
  }
}
```

Rate limiting can be enabled by setting:

```
NOTIFICATION_RATE_LIMIT_ENABLED=true
```

## Cache Invalidation

Caches are now properly invalidated when notifications change:

```typescript
// Invalidate cache for this user
if (redisClient && process.env.NOTIFICATION_CACHE_ENABLED === 'true') {
  try {
    // Delete all notification list caches for this user
    const pattern = `${REDIS_KEYS.USER_NOTIFICATIONS}${userId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    
    // Delete unread count cache
    await redisClient.del(`user:unread_count:${userId}`);
  } catch (cacheError) {
    logger.warn('Failed to invalidate notification caches:', cacheError);
  }
}
```

## NotificationBatch Model

A new model has been added to track batches of notifications:

```prisma
model NotificationBatch {
  id        String   @id @default(cuid())
  type      String
  status    String   // 'processing', 'completed', 'failed'
  metadata  Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([type])
  @@index([status])
  @@index([createdAt])
}
```

This model is used to track the progress of batch notification operations, such as sending notifications to all followers when a new chapter is published.

## Environment Variables

The following environment variables can be used to configure the optimized notification system:

```
# Redis Health Check
REDIS_HEALTH_CHECK_ENABLED=true
REDIS_HEALTH_CHECK_INTERVAL=30000

# Notification Caching
NOTIFICATION_CACHE_ENABLED=true
NOTIFICATION_CACHE_TTL=30
UNREAD_COUNT_CACHE_TTL=60

# Rate Limiting
NOTIFICATION_RATE_LIMIT_ENABLED=true
```

## Performance Impact

These optimizations provide several benefits:

1. **Reduced Database Load**: Caching reduces the number of database queries
2. **Improved Response Time**: Cached notifications are served faster
3. **Better Scalability**: Batch processing and rate limiting improve system stability under load
4. **Increased Reliability**: Health checks ensure Redis connections remain active
5. **Better Monitoring**: The NotificationBatch model provides visibility into notification processing
