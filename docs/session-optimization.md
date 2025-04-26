# Session Management Optimization

This document outlines the session management optimization implemented in the FableSpace application to reduce unnecessary polling and improve performance.

## Problem

NextAuth.js by default implements session polling to keep the session fresh. This can lead to frequent `/api/auth/session` requests, which can:

1. Increase server load
2. Consume unnecessary bandwidth
3. Potentially trigger rate limiting
4. Affect application performance

## Solution

We've implemented a multi-layered approach to optimize session management:

### 1. Disabled Automatic Polling

The `SessionProvider` in `src/app/providers.tsx` has been configured to completely disable automatic polling:

```jsx
<SessionProvider
  refetchInterval={0} // Completely disabled automatic polling
  refetchOnWindowFocus={false}
  refetchWhenOffline={false}
>
```

This eliminates the automatic polling requests that were causing Redis connection cycling.

### 2. Rate Limiting for Session Endpoints

A specific rate limit configuration has been added for session endpoints in `src/lib/security/rate-limit.ts`:

```typescript
// Session endpoints (optimized to reduce polling load)
session: {
  limit: 60,
  windowMs: 60 * 60 * 1000, // 1 hour
  useProgressiveBackoff: false,
  trackSuspiciousActivity: false,
},
```

This prevents excessive requests to the session endpoint.

### 3. Enhanced Custom Session Hook

A custom hook `useOptimizedSession` has been enhanced to handle session refreshes proactively:

```typescript
import { useOptimizedSession } from '@/hooks/useOptimizedSession';

// In your component
const { session, status, refreshSession } = useOptimizedSession({
  enableManualRefresh: true, // Enable proactive session refresh
  onExpired: () => {
    // Handle session expiration
  }
});
```

This hook:
- Wraps the NextAuth `useSession` hook
- Provides manual refresh functionality
- Prevents too frequent refreshes (minimum 5 minutes between refreshes)
- Automatically refreshes the session 5 minutes before expiration
- Logs when sessions will be refreshed for debugging
- Handles session expiration gracefully

## Best Practices

When working with sessions in the application:

1. Use the `useOptimizedSession` hook instead of the standard `useSession` hook when possible
2. Only refresh the session when necessary (e.g., after user actions that modify the session)
3. Avoid unnecessary session dependencies in components that don't need them
4. Consider using React Context to share session data instead of calling `useSession` in many components

### 4. Consolidated Redis Client

All Redis connections have been consolidated to use a single global Redis client:

- The main Redis client is defined in `src/lib/redis.ts` as a global singleton
- All other modules that need Redis now use this shared client:
  - Session management (`src/lib/auth/session-manager.ts`)
  - Security monitoring (`src/lib/monitoring/security-monitor.ts`)
  - Rate limiting (`src/lib/security/rate-limit.ts`)

This prevents connection cycling and reduces resource usage.

## Monitoring

Monitor the following in production:

1. **Session Requests**: The frequency of `/api/auth/session` requests should be significantly reduced
2. **Redis Connections**: Redis connections should be stable without frequent disconnects/reconnects
3. **Memory Usage**: The application should use less memory due to fewer Redis connections
4. **Error Logs**: Watch for any Redis-related errors in the logs

If issues persist, consider further optimizations to the Redis connection management.
