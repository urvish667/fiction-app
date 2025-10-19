# Rate Limiting Architecture

## Overview

FableSpace uses a **Redis-first rate limiting architecture** with automatic fallback to in-memory storage. This provides distributed, accurate rate limiting across all server instances while maintaining reliability.

## Architecture

### Primary: Security Rate Limiter (Edge Runtime Compatible)

**File:** `src/lib/security/rate-limit.ts`

**Key Features:**
- **Edge Runtime Compatible**: Works in Next.js middleware
- **Automatic Redis Detection**: Uses Redis when available (non-Edge runtime)
- **In-Memory Fallback**: Works without external dependencies
- **Progressive Backoff**: Increases retry time for repeat offenders
- **Suspicious Activity Tracking**: Logs potential abuse

**How It Works:**
```typescript
// Automatically detects runtime environment
if (isEdgeRuntime || !redis) {
  // Use in-memory storage
} else {
  // Use Redis for distributed rate limiting
}
```

### Redis Rate Limiter (Node.js API Routes Only)

**File:** `src/lib/redis/rate-limiter.ts`

**Key Features:**
- **Sliding Window Algorithm**: More accurate than fixed windows
- **Lua Scripts**: Atomic operations prevent race conditions
- **Distributed**: Works across multiple server instances
- **Persistent**: Rate limits survive server restarts
- **Auto-cleanup**: Old entries are automatically removed

**Usage:** Can be used directly in **Node.js API routes** (not middleware):
```typescript
import { rateLimit } from '@/lib/redis/rate-limiter';

// In API route handler (Node.js runtime)
const result = await rateLimit(`${ip}:${path}`, {
  limit: 100,
  windowMs: 60000,
});
```

**Limitations:**
- ❌ Cannot be used in Edge Runtime (middleware)
- ✅ Only for Node.js API route handlers

## Middleware Integration

**File:** `src/middleware.ts`

**Important:** Middleware runs in Edge Runtime, which doesn't support Node.js modules like `ioredis`.

The middleware uses the **Security Rate Limiter** which is Edge Runtime compatible:

```typescript
// Edge Runtime compatible
const result = await rateLimit(request, {
  ...rateLimitConfigs.default,
  includeUserContext: true,
});

if (!result.success) {
  return createRateLimitResponse(result, error, message);
}
```

The Security Rate Limiter will automatically:
1. Use **in-memory storage** in Edge Runtime (middleware)
2. Use **Redis** in Node.js API routes (if available)
3. Fall back to **in-memory** if Redis fails

### Helper Functions

**1. `getRetryAfter(result)`**
- Calculates retry time considering progressive backoff
- Handles optional backoffFactor

**2. `createRateLimitResponse(result, error, message)`**
- Generates standardized 429 responses
- Includes rate limit headers
- Reduces code duplication

## Rate Limit Configurations

Different endpoint types have different limits:

| Endpoint Type | Limit | Window | Key Prefix |
|--------------|-------|--------|------------|
| **Editor/Autosave** | 120 requests | 5 minutes | `ratelimit:editor:` |
| **Credential Login** | 5 requests | 5 minutes | `ratelimit:auth:credentials:` |
| **OAuth Login** | 10 requests | 10 minutes | `ratelimit:auth:oauth:` |
| **General Auth** | 20 requests | 10 minutes | `ratelimit:auth:` |
| **Forum Posts** | 3 requests | 1 minute | `ratelimit:forum:` |
| **Default API** | 100 requests | 1 minute | `ratelimit:api:` |

## Key Generation

Keys are generated based on:

1. **IP Address**: Primary identifier
2. **Path**: Endpoint being accessed
3. **User ID** (optional): For user-specific limits (e.g., forum posts)

Examples:
```
ratelimit:editor:192.168.1.1:/api/stories/123/chapters/456
ratelimit:auth:credentials:192.168.1.1:/api/auth/signin/credentials
ratelimit:forum:192.168.1.1:user-123:forum:posts
ratelimit:api:192.168.1.1:/api/stories
```

## Response Format

### Success (200)

```json
{
  "data": "..."
}
```

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1729253400
```

### Rate Limited (429)

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 30
}
```

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1729253400
Retry-After: 30
```

## Progressive Backoff

Some endpoints (auth, forum posts) use progressive backoff:

- **1st violation**: Retry after normal window (e.g., 5 minutes)
- **2nd violation**: Retry after 2x window (e.g., 10 minutes)
- **3rd violation**: Retry after 3x window (e.g., 15 minutes)
- **Max**: Capped at configured `maxBackoffFactor`

This discourages brute force attacks and abuse.

## Testing

See `RATE_LIMIT_TESTING.md` for comprehensive testing guide.

**Quick test:**
```bash
# Test default API endpoint
node test-rate-limit.js /api/stories 110

# Test auth endpoint
node test-rate-limit.js /api/auth/session 25

# Browser test
open test-rate-limit.html
```

## Monitoring

### Log Messages

**Redis Active:**
- No special logs (silent success)

**Redis Failure:**
- "Redis not available for rate limiting, allowing request"
- "Redis rate limiting error"

**Suspicious Activity:**
- "Suspicious rate limit activity detected"
- Logged when violations exceed threshold

### Redis Keys

Check active rate limits in Redis:
```bash
redis-cli keys "ratelimit:*"
redis-cli zrange "ratelimit:api:192.168.1.1:/api/stories" 0 -1 WITHSCORES
```

## Configuration

### Environment Variables

```env
# Enable Redis for rate limiting (optional, auto-detected)
RATE_LIMIT_REDIS_ENABLED=true

# IP addresses to exclude from rate limiting
RATE_LIMIT_ALLOWLIST=127.0.0.1,::1,10.0.0.0/8
```

### Adjusting Limits

Edit `src/lib/security/rate-limit.ts`:

```typescript
export const rateLimitConfigs = {
  default: {
    limit: 100,        // Change this
    windowMs: 60 * 1000, // Or this
  },
  // ...
};
```

## Best Practices

1. **Monitor rate limit violations** in production logs
2. **Adjust limits** based on real-world usage patterns
3. **Use Redis** in production for distributed deployments
4. **Test thoroughly** before deploying limit changes
5. **Implement client-side retry logic** with exponential backoff
6. **Cache responses** to reduce API calls
7. **Show user-friendly messages** when rate limited

## Troubleshooting

### Not getting rate limited?

1. Check if dev mode skip is enabled
2. Verify you're not on the allowlist
3. Ensure Redis is connected (check logs)
4. Try increasing request count in tests

### Rate limits too strict?

1. Review current limits in `rateLimitConfigs`
2. Consider endpoint-specific adjustments
3. Monitor logs for violation patterns
4. Implement caching on client side

### Redis connection issues?

1. System automatically falls back to in-memory
2. Check Redis connection string
3. Verify Redis is running: `redis-cli ping`
4. Review connection logs

## Future Enhancements

Potential improvements:

- [ ] User-tier based limits (free vs premium)
- [ ] Geographic rate limiting
- [ ] Dynamic rate limits based on server load
- [ ] Rate limit analytics dashboard
- [ ] Webhook notifications for abuse patterns
- [ ] CIDR range support for allowlisting
- [ ] Rate limit override API for support team

## Related Files

- `src/lib/redis/rate-limiter.ts` - Redis rate limiter
- `src/lib/security/rate-limit.ts` - Fallback rate limiter
- `src/middleware.ts` - Middleware integration
- `RATE_LIMIT_TESTING.md` - Testing guide
- `test-rate-limit.js` - CLI test script
- `test-rate-limit.html` - Browser test tool
