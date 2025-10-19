# Edge Runtime Rate Limiting Fix

## The Problem

### Error Encountered
```
Runtime TypeError: Cannot read properties of undefined (reading 'charCodeAt')
at redis-errors/index.js
at ioredis/built/cluster/index.js
```

### Root Cause

Next.js **middleware runs in Edge Runtime by default**, which is a lightweight runtime that:
- ✅ Supports Web APIs
- ✅ Extremely fast cold starts
- ✅ Runs on edge locations globally
- ❌ **Does NOT support Node.js modules** (like `ioredis`)

When we tried to import the Redis rate limiter (`src/lib/redis/rate-limiter.ts`) directly in middleware, it attempted to load `ioredis` at build time, causing the error.

## The Solution

### Use Security Rate Limiter in Middleware

The **Security Rate Limiter** (`src/lib/security/rate-limit.ts`) is designed to be Edge Runtime compatible:

```typescript
// ❌ DOESN'T WORK - Edge Runtime can't load ioredis
import { rateLimit as rateLimitRedis } from '@/lib/redis/rate-limiter';

// ✅ WORKS - Edge Runtime compatible
import { rateLimit } from '@/lib/security/rate-limit';
```

### How Security Rate Limiter Handles This

The Security Rate Limiter **automatically detects the runtime**:

```typescript
export function getRateLimitRedisClient(): any | null {
  // Check if we're in Edge Runtime
  const isEdgeRuntime = typeof process !== 'undefined' &&
    process.env.NEXT_RUNTIME === 'edge';

  // Don't use Redis in Edge Runtime
  if (isEdgeRuntime) {
    return null; // Falls back to in-memory
  }

  // In Node.js runtime, try to use Redis
  try {
    const { getRedisClient } = require('../redis');
    return getRedisClient();
  } catch (error) {
    return null; // Falls back to in-memory
  }
}
```

## Architecture Summary

### Middleware (Edge Runtime)
```
Request → Middleware (Edge Runtime)
         ↓
         Security Rate Limiter
         ↓
         In-Memory Storage (per-instance)
         ↓
         Response
```

**Trade-offs:**
- ⚡ Ultra-fast (Edge Runtime)
- 🌍 Runs globally on edge
- ⚠️ Not distributed (per-instance)
- ⚠️ Resets on deployment

### API Routes (Node.js Runtime)

You can still use Redis rate limiter **directly in API routes**:

```typescript
// pages/api/my-route.ts or app/api/my-route/route.ts
import { rateLimit } from '@/lib/redis/rate-limiter';

export async function GET(request: Request) {
  // Get IP from request
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  
  // Apply Redis-based rate limiting
  const result = await rateLimit(`${ip}:${request.url}`, {
    limit: 100,
    windowMs: 60000,
  });

  if (!result.success) {
    return new Response('Rate limited', { status: 429 });
  }

  // Your API logic here
  return Response.json({ data: 'success' });
}
```

**Benefits:**
- 🔄 Distributed across all instances
- 💾 Persistent (survives restarts)
- 🎯 More accurate (sliding window + Lua scripts)
- 🧹 Automatic cleanup

## Changes Made

### 1. Reverted Middleware Import
```typescript
// Before (causing Edge Runtime error)
import { rateLimit as rateLimitRedis } from '@/lib/redis/rate-limiter';
import { rateLimit as rateLimitFallback } from '@/lib/security/rate-limit';

// After (Edge Runtime compatible)
import { rateLimit } from '@/lib/security/rate-limit';
```

### 2. Simplified Rate Limit Calls

```typescript
// Before (trying to use Redis directly)
const result = await rateLimitRedis(key, config)
  .catch(() => rateLimitFallback(request, config));

// After (automatic runtime detection)
const result = await rateLimit(request, config);
```

### 3. Kept Helper Functions

The helper functions remain for cleaner code:
- `getRetryAfter()` - Calculates retry time with backoff
- `createRateLimitResponse()` - Generates standardized responses

## Testing

The rate limiting still works correctly! Test with:

```bash
# Test default API (100 req/min)
node test-rate-limit.js /api/stories 110

# Test auth (20 req/10min)
node test-rate-limit.js /api/auth/session 25

# Browser test
start test-rate-limit.html
```

You'll see rate limiting kick in at the configured thresholds.

## When to Use Each Rate Limiter

### Use Security Rate Limiter When:
- ✅ In middleware (required for Edge Runtime)
- ✅ Need Edge Runtime performance
- ✅ Don't need distributed rate limiting
- ✅ Single-instance or small deployments

### Use Redis Rate Limiter When:
- ✅ In API route handlers (Node.js runtime)
- ✅ Need distributed rate limiting
- ✅ Multiple server instances
- ✅ Need persistent rate limits
- ✅ Want accurate sliding window algorithm

## Future Considerations

If you need **distributed rate limiting in middleware**, consider:

### Option 1: Upstash Redis (Edge Compatible)
```typescript
import { Redis } from '@upstash/redis';

// Upstash Redis works in Edge Runtime
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
```

### Option 2: Vercel KV (Edge Compatible)
```typescript
import { kv } from '@vercel/kv';

// Vercel KV works in Edge Runtime
const result = await kv.incr(`ratelimit:${key}`);
```

### Option 3: Cloudflare Rate Limiting
If deploying to Cloudflare, use their native rate limiting.

## Summary

✅ **Fixed:** Edge Runtime error by using compatible rate limiter  
✅ **Maintained:** All rate limiting functionality works  
✅ **Simplified:** Cleaner code without try-catch fallbacks  
✅ **Documented:** Clear guidance on which limiter to use  

The middleware now works correctly in Edge Runtime with in-memory rate limiting. For distributed rate limiting, use the Redis rate limiter directly in API routes.
