# Redis Configuration Guide

This document explains how to configure Redis for the FableSpace application, including the notification system.

## Environment Variables

The following environment variables control Redis behavior:

```
# Redis Connection
REDIS_ENABLED=true                  # Set to 'false' to disable Redis completely
REDIS_HOST=your-redis-host          # Redis host (e.g., localhost or redis.example.com)
REDIS_PORT=6379                     # Redis port (default: 6379)
REDIS_PASSWORD=your-redis-password  # Redis password
REDIS_TLS=false                     # Set to 'true' to use TLS/SSL for Redis connection

# Redis Health Check
REDIS_HEALTH_CHECK_ENABLED=true     # Set to 'true' to enable Redis health checks
REDIS_HEALTH_CHECK_INTERVAL=30000   # Health check interval in milliseconds (default: 30000)

# Notification Caching
NOTIFICATION_CACHE_ENABLED=true     # Set to 'true' to enable notification caching
NOTIFICATION_CACHE_TTL=30           # Cache TTL in seconds for notification lists (default: 30)
UNREAD_COUNT_CACHE_TTL=60           # Cache TTL in seconds for unread counts (default: 60)

# Rate Limiting
NOTIFICATION_RATE_LIMIT_ENABLED=true # Set to 'true' to enable notification rate limiting
```

## Fallback Behavior

The system is designed to gracefully handle Redis unavailability:

1. If Redis is disabled (`REDIS_ENABLED=false`), all Redis-dependent features will be disabled.
2. If Redis is enabled but unavailable, the system will:
   - Log warnings about Redis connection failures
   - Continue to function using the database for notifications
   - Automatically attempt to reconnect to Redis periodically

## Notification System Configuration

### Caching

Notification caching can significantly reduce database load. When enabled:

- Notification lists are cached for a configurable period (default: 30 seconds)
- Unread notification counts are cached for a configurable period (default: 60 seconds)
- Caches are automatically invalidated when notifications are created, read, or deleted

To enable caching:

```
NOTIFICATION_CACHE_ENABLED=true
NOTIFICATION_CACHE_TTL=30
UNREAD_COUNT_CACHE_TTL=60
```

### Rate Limiting

Rate limiting prevents notification spam. When enabled:

- Users are limited to a maximum number of notifications per minute
- Different limits apply to different notification types
- Chapter notifications are limited to 5 per minute
- Other notification types are limited to 20 per minute

To enable rate limiting:

```
NOTIFICATION_RATE_LIMIT_ENABLED=true
```

## WebSocket Integration

The notification system uses Redis pub/sub to communicate with the WebSocket server:

1. When a notification is created, it's published to the Redis `notifications` channel
2. The WebSocket server subscribes to this channel and forwards notifications to connected clients
3. If Redis is unavailable, real-time notifications will not work, but polling will still function

## Troubleshooting

### Redis Connection Issues

If you're experiencing Redis connection issues:

1. Check that Redis is running and accessible from your application server
2. Verify that the Redis connection parameters are correct
3. Check the application logs for Redis-related errors
4. Enable Redis health checks to automatically recover from connection issues

### Notification Delivery Issues

If notifications are not being delivered:

1. Check if Redis is connected and functioning properly
2. Verify that the WebSocket server is running and connected to Redis
3. Check that clients are successfully connecting to the WebSocket server
4. Ensure that notification caching is properly configured

### Performance Issues

If you're experiencing performance issues:

1. Enable notification caching to reduce database load
2. Increase cache TTLs to reduce Redis and database load
3. Enable rate limiting to prevent notification spam
4. Consider using a Redis cluster for high-load environments

## Monitoring

The system logs Redis-related events at various levels:

- `INFO`: Connection events, initialization
- `WARN`: Connection issues, cache misses
- `ERROR`: Connection failures, Redis errors

Monitor these logs to identify and resolve Redis-related issues.
