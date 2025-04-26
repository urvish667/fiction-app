# Redis Connection Management

This document outlines the Redis connection management strategy for the FableSpace application.

## Overview

FableSpace uses Redis for several purposes:
- Rate limiting
- Notification delivery
- WebSocket communication
- Session management

To ensure optimal performance and stability, we've implemented a centralized Redis connection management system.

## Connection Strategy

### Singleton Pattern

We use a singleton pattern to ensure that only one Redis connection is created and reused throughout the application:

- The main Redis client is defined in `src/lib/redis.ts`
- All other modules that need Redis should import and use this shared client
- The client is stored in a global variable to ensure it persists across requests

### Connection Pooling

The Redis client is configured with connection pooling options to handle multiple concurrent requests efficiently:

```typescript
const REDIS_OPTIONS: RedisOptions = {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    return Math.min(times * 100, 1000);
  },
  enableReadyCheck: true,
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  },
  connectTimeout: 10000, // 10 seconds
  keepAlive: 10000, // 10 seconds
  autoResubscribe: false,
  autoResendUnfulfilledCommands: false,
  connectionName: 'fablespace-main',
};
```

### Connection Lifecycle

The Redis connection is managed as follows:

1. **Creation**: A connection is created when the application starts or when the first request needs Redis
2. **Reuse**: The same connection is reused for subsequent requests
3. **Reconnection**: If the connection is lost, it will automatically reconnect with exponential backoff
4. **Cleanup**: The connection is properly closed when the application shuts down

## Best Practices

When working with Redis in the FableSpace application, follow these best practices:

1. **Always use the shared client**: Import the Redis client from `src/lib/redis.ts` instead of creating new connections
2. **Handle connection errors**: Always wrap Redis operations in try/catch blocks
3. **Use transactions**: For operations that require multiple commands, use Redis transactions
4. **Avoid blocking operations**: Redis is single-threaded, so avoid long-running operations
5. **Set appropriate timeouts**: Configure timeouts for operations that might take a long time

## Troubleshooting

### Connection Cycling

If you notice Redis connections being created and closed frequently:

1. Check if any code is creating new Redis connections instead of using the shared client
2. Verify that the Redis server is properly configured and has enough resources
3. Check for network issues between the application and Redis server
4. Increase the connection timeout and retry settings if needed
5. Look for frequent API polling that might be causing Redis connections to cycle

### Notification Polling

The notification system has been optimized to reduce Redis connection cycling:

1. **WebSocket Priority**: The system prioritizes WebSocket connections for real-time updates
2. **Reduced Polling Frequency**: Fallback polling frequency has been reduced from 15 seconds to 60 seconds
3. **Global Redis Client**: All notification-related Redis operations use the global Redis client
4. **Connection Reuse**: Redis connections are reused across notification operations

### Connection Errors

Common Redis connection errors and their solutions:

1. **ECONNREFUSED**: Redis server is not running or not accessible
2. **ETIMEDOUT**: Connection timeout, check network or increase timeout settings
3. **ECONNRESET**: Connection was reset, check for network issues or Redis server restarts
4. **READONLY**: Redis is in read-only mode, typically in a replica

## Azure Redis Cache Considerations

When using Azure Redis Cache:

1. **Use SSL**: Always use the `rediss://` protocol instead of `redis://`
2. **Set appropriate timeouts**: Azure Redis might have higher latency than local Redis
3. **Monitor cache usage**: Use Azure metrics to monitor cache usage and performance
4. **Configure firewall rules**: Ensure your application has access to the Redis cache

## References

- [ioredis Documentation](https://github.com/luin/ioredis)
- [Azure Redis Cache Documentation](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/)
- [Redis Best Practices](https://redis.io/topics/clients)
