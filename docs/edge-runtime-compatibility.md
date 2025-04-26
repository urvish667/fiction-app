# Edge Runtime Compatibility

This document explains how FableSpace handles compatibility with Next.js Edge Runtime.

## Overview

Next.js Edge Runtime is a lightweight JavaScript runtime that runs on the edge (CDN nodes). It has several limitations compared to the Node.js runtime:

1. Limited Node.js APIs
2. No access to the filesystem
3. Limited support for npm packages
4. No support for native modules

## Redis in Edge Runtime

One of the key challenges is that the `ioredis` package is not fully compatible with Edge Runtime. This affects our rate limiting and other Redis-dependent features.

### Our Solution

We've implemented a fallback mechanism that:

1. Detects when the code is running in Edge Runtime
2. Falls back to in-memory storage for rate limiting
3. Avoids importing Redis-related code in Edge Runtime

## Implementation Details

### Detection of Edge Runtime

```typescript
const isEdgeRuntime = typeof process !== 'undefined' && 
  process.env.NEXT_RUNTIME === 'edge';
```

### Conditional Imports

```typescript
// Only import Redis if we're not in Edge Runtime
if (!isEdgeRuntime) {
  try {
    // Dynamic import to avoid Edge Runtime errors
    const ioredis = require('ioredis');
    Redis = ioredis.Redis;
    const redisModule = require('./redis');
    getRedisClient = redisModule.getRedisClient;
  } catch (error) {
    console.warn('Redis import failed, using in-memory store only:', error);
  }
}
```

### Fallback to In-Memory Storage

When running in Edge Runtime, we automatically fall back to in-memory storage for rate limiting:

```typescript
// If we're not in Edge Runtime and Redis is available
if (!isEdgeRuntime && typeof getRedisClient === 'function') {
  // Use Redis for rate limiting
} else {
  // Use in-memory store for rate limiting
}
```

## Limitations

Using in-memory storage for rate limiting in Edge Runtime has some limitations:

1. **No Persistence**: Rate limit counters are reset when the Edge function is redeployed
2. **No Sharing**: Each Edge node has its own in-memory store, so rate limits are not shared
3. **Limited Storage**: Edge Runtime has limited memory, so we can't store too many rate limit entries

## Best Practices

When working with Edge Runtime in FableSpace:

1. **Avoid Direct Redis Usage**: Don't directly use Redis in middleware or Edge API routes
2. **Use Conditional Imports**: Always use conditional imports for Node.js-specific modules
3. **Provide Fallbacks**: Implement fallbacks for features that depend on Node.js APIs
4. **Test in Edge Environment**: Always test your changes in an Edge environment

## Future Improvements

Potential future improvements for Edge Runtime compatibility:

1. **Distributed Rate Limiting**: Implement a distributed rate limiting solution that works in Edge Runtime
2. **Edge-Compatible Redis Client**: Find or create a Redis client that works in Edge Runtime
3. **Serverless KV Storage**: Use Vercel's KV storage or similar edge-compatible key-value stores

## References

- [Next.js Edge Runtime Documentation](https://nextjs.org/docs/api-reference/edge-runtime)
- [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions)
- [Edge Runtime Compatibility](https://edge-runtime.vercel.app/features/compatibility)
