# Rate Limiting Testing Guide

This guide explains how to test the rate limiting functionality in FableSpace.

## Overview

Rate limiting is **already enabled** for all API endpoints through the middleware. No additional configuration is needed!

### Current Rate Limits

| Endpoint Type | Limit | Window | Notes |
|--------------|-------|--------|-------|
| **Default API** | 100 requests | 1 minute | All `/api/*` routes |
| **Auth (General)** | 20 requests | 10 minutes | Login, registration |
| **Credential Login** | 5 requests | 5 minutes | Password-based login (strictest) |
| **OAuth Login** | 10 requests | 10 minutes | Google, Twitter login |
| **Editor/Autosave** | 120 requests | 5 minutes | Chapter editing endpoints |
| **Forum Posts** | 3 posts | 1 minute | Creating forum posts |
| **Search** | 60 requests | 1 minute | Search endpoints |

## Testing Methods

### Method 1: Node.js Test Script

Run the automated test script:

```bash
# Test default API endpoint (100 requests/minute limit)
node test-rate-limit.js /api/stories 120

# Test auth endpoint (20 requests/10 min limit)
node test-rate-limit.js /api/auth/session 25

# Test credential login (5 requests/5 min limit)
node test-rate-limit.js /api/auth/signin/credentials 10

# Test with custom base URL (for production testing)
BASE_URL=https://your-domain.com node test-rate-limit.js /api/stories 120
```

**Expected Results:**
- First N requests should succeed (200 status)
- Requests beyond the limit should return 429 (Too Many Requests)
- Response headers will include:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets
  - `Retry-After`: Seconds until you can retry

### Method 2: cURL Testing

Test individual endpoints manually:

```bash
# Test a single request and view headers
curl -i http://localhost:3000/api/stories

# Rapid fire requests to trigger rate limit
for i in {1..110}; do 
  echo "Request $i:"
  curl -s -o /dev/null -w "%{http_code} - Remaining: %{header_json}[x-ratelimit-remaining]\n" \
    http://localhost:3000/api/stories
  sleep 0.1
done

# Test with authentication (if you have a token)
for i in {1..110}; do 
  curl -s -H "Authorization: Bearer YOUR_TOKEN" \
    -o /dev/null -w "%{http_code}\n" \
    http://localhost:3000/api/stories
  sleep 0.1
done
```

### Method 3: Browser Console

Open your browser's developer console on your app and run:

```javascript
// Test rate limiting in browser
async function testRateLimit(endpoint = '/api/stories', requests = 110) {
  const results = { success: 0, rateLimited: 0, errors: 0 };
  
  console.log(`Testing ${endpoint} with ${requests} requests...`);
  
  for (let i = 1; i <= requests; i++) {
    try {
      const response = await fetch(endpoint);
      const remaining = response.headers.get('x-ratelimit-remaining');
      const limit = response.headers.get('x-ratelimit-limit');
      
      if (response.status === 429) {
        results.rateLimited++;
        const retryAfter = response.headers.get('retry-after');
        console.log(`❌ Request ${i}: RATE LIMITED (Retry after: ${retryAfter}s)`);
      } else if (response.ok) {
        results.success++;
        console.log(`✅ Request ${i}: SUCCESS (${remaining}/${limit} remaining)`);
      } else {
        results.errors++;
        console.log(`⚠️ Request ${i}: ERROR (${response.status})`);
      }
    } catch (error) {
      results.errors++;
      console.log(`❌ Request ${i}: FAILED (${error.message})`);
    }
    
    // Small delay to avoid browser throttling
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n📊 Results:', results);
  return results;
}

// Run the test
testRateLimit('/api/stories', 110);

// Test auth endpoint (stricter limits)
// testRateLimit('/api/auth/session', 25);
```

### Method 4: Postman/Thunder Client

1. Create a new request to your API endpoint
2. Use the **Collection Runner** or **Repeat Request** feature
3. Set iterations to exceed the rate limit (e.g., 110 for default APIs)
4. Run and observe:
   - First N requests return 200
   - Subsequent requests return 429

## Understanding the Response

### Successful Response (200)

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

### Rate Limited Response (429)

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

## Testing Different Endpoint Types

### Test Editor Endpoints (Autosave)

These have higher limits (120 requests/5 minutes):

```bash
# Replace {storyId} and {chapterId} with actual IDs
node test-rate-limit.js /api/stories/{storyId}/chapters/{chapterId} 130
```

### Test Auth Endpoints

Credential login has the strictest limits (5 requests/5 minutes):

```bash
# This should rate limit after 5 requests
node test-rate-limit.js /api/auth/signin/credentials 10
```

### Test Forum Posts

Forum posts are limited to 3 per minute:

```bash
# Note: This requires POST requests with auth
curl -X POST http://localhost:3000/api/forum/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test post"}'
```

## Redis vs In-Memory

### Important: Edge Runtime Limitation

**Middleware runs in Edge Runtime** which doesn't support Node.js modules like `ioredis`. Therefore:

- ✅ **Middleware**: Uses in-memory rate limiting (per-instance)
- ✅ **API Routes (Node.js)**: Can use Redis for distributed rate limiting

### Architecture

**Security Rate Limiter (`src/lib/security/rate-limit.ts`)**
- Used in middleware (Edge Runtime compatible)
- In-memory storage in Edge Runtime
- Can use Redis in Node.js runtime (API routes)
- Progressive backoff for repeat offenders
- Suspicious activity tracking

**Redis Rate Limiter (`src/lib/redis/rate-limiter.ts`)**
- Only for Node.js API routes (not middleware)
- Uses Redis sorted sets with sliding window
- Lua scripts for atomic operations
- Distributed and persistent
- More accurate rate limiting

### How It Works

```typescript
// Middleware (Edge Runtime) - uses security rate limiter
const result = await rateLimit(request, config);

// API Route (Node.js) - can use Redis rate limiter directly
import { rateLimit } from '@/lib/redis/rate-limiter';
const result = await rateLimit(key, config);
```

### For Distributed Rate Limiting

If you need distributed rate limiting in middleware:

**Option 1:** Use Node.js runtime for API routes with Redis limiter
**Option 2:** Run middleware in Node.js runtime (not recommended, slower)
**Option 3:** Use external rate limiting service (e.g., Upstash, Cloudflare)

## Monitoring Rate Limits

### View Current Rate Limit Status

You can check your current rate limit status without making a request that counts:

```bash
# Check headers of any successful request
curl -I http://localhost:3000/api/stories
```

Look for:
- `X-RateLimit-Limit`: Your total allowance
- `X-RateLimit-Remaining`: How many requests you have left
- `X-RateLimit-Reset`: When your limit resets (Unix timestamp)

### Reset Rate Limit for Testing

If you need to reset a rate limit during testing:

```javascript
// In a Node.js script or API route with Redis access
import { resetRateLimit } from '@/lib/redis/rate-limiter';

// Reset for a specific key
await resetRateLimit('127.0.0.1:/api/stories');
```

## Progressive Backoff

Some endpoints (auth, forum posts) use **progressive backoff**, which increases the retry delay for repeated violations:

- First violation: Retry after normal window
- Second violation: Retry after 2x window
- Third violation: Retry after 3x window
- ... up to max backoff factor

Test this by continuing to make requests after being rate limited:

```bash
# Make requests until rate limited
for i in {1..20}; do 
  curl -s http://localhost:3000/api/auth/signin/credentials
  sleep 0.5
done
```

## Troubleshooting

### Not Getting Rate Limited?

1. **Check if dev mode skip is enabled:**
   - Some configs have `skipInDevelopment: true`
   - Set `NODE_ENV=production` to test in dev

2. **Check your IP:**
   - You might be on the allowlist
   - Check `process.env.RATE_LIMIT_ALLOWLIST`

3. **Redis connection:**
   - Verify Redis is running: `redis-cli ping`
   - Check connection in logs

### Rate Limits Too Strict/Lenient?

Edit the configurations in `src/lib/security/rate-limit.ts`:

```typescript
export const rateLimitConfigs = {
  default: {
    limit: 100,  // Change this
    windowMs: 60 * 1000,  // Or this
  },
  // ...
};
```

## Best Practices

1. **Always check rate limit headers** in your client code
2. **Implement exponential backoff** in your API clients
3. **Show user-friendly messages** when rate limited
4. **Cache responses** to reduce API calls
5. **Use authenticated endpoints** for higher limits (where applicable)

## Production Considerations

- **Monitor rate limit violations** in your logs
- **Adjust limits** based on real-world usage patterns
- **Consider user tiers** with different limits (future enhancement)
- **Alert on suspicious activity** (already built-in)
- **Use Redis** for distributed deployments

## Additional Resources

- Rate limiter source: `src/lib/redis/rate-limiter.ts`
- Security rate limit wrapper: `src/lib/security/rate-limit.ts`
- Middleware configuration: `src/middleware.ts`
