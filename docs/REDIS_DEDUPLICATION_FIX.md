# Redis View Tracking - Deduplication Fix

## Problem

Views were being counted twice even for the same logged-in user viewing the same chapter/story. The logs showed:

```
[Redis] Successfully tracked chapter view: cmb7xj5850001iz40sfdmevkw, buffered count: 1, user: anonymous
[Redis] Successfully tracked chapter view: cmb7xj5850001iz40sfdmevkw, buffered count: 2, user: anonymous
```

Both calls happened within milliseconds (11:19:08.795Z to 11:19:08.797Z).

## Root Cause

**Race Condition in Deduplication Logic**

The original implementation had a race condition:

```typescript
// OLD CODE (VULNERABLE TO RACE CONDITIONS)
const exists = await redis.exists(dedupKey);  // Check if key exists
const isFirstView = exists === 0;

if (!isFirstView) {
  return { success: true, isFirstView: false, bufferedCount };
}

// Later in pipeline...
pipeline.setex(dedupKey, VIEW_TRACKING_CONFIG.DEDUP_TTL, '1');  // Set the key
```

**The Problem:**
1. Request A checks `exists(dedupKey)` → returns 0 (doesn't exist)
2. Request B checks `exists(dedupKey)` → returns 0 (still doesn't exist)
3. Request A sets the dedup key in pipeline
4. Request B sets the dedup key in pipeline
5. **Both requests increment the counter!**

This happens because there's a time gap between checking and setting the deduplication key.

## Solution

**Atomic Deduplication with SETNX**

Use Redis's `SET ... NX` (SET if Not eXists) command for atomic check-and-set:

```typescript
// NEW CODE (ATOMIC)
const wasSet = await redis.set(dedupKey, '1', 'EX', VIEW_TRACKING_CONFIG.DEDUP_TTL, 'NX');
const isFirstView = wasSet === 'OK';

if (!isFirstView) {
  logger.info(`[Redis] Duplicate view detected, skipping`);
  return { success: true, isFirstView: false, bufferedCount };
}

// Dedup key is already set atomically, just increment buffer
pipeline.incr(bufferKey);
```

**How It Works:**
1. Request A tries `SET ... NX` → succeeds, returns 'OK'
2. Request B tries `SET ... NX` → fails (key exists), returns null
3. Only Request A proceeds to increment the counter
4. Request B is rejected as duplicate

This is **atomic** - Redis guarantees only one SET ... NX will succeed.

## Changes Made

### 1. Story View Tracking (`trackStoryViewRedis`)
- ✅ Replaced `exists()` + `setex()` with atomic `SET ... NX`
- ✅ Added detailed logging for deduplication checks
- ✅ Fixed pipeline result index (removed redundant SETEX)

### 2. Chapter View Tracking (`trackChapterViewRedis`)
- ✅ Replaced `exists()` + `setex()` with atomic `SET ... NX`
- ✅ Added detailed logging for deduplication checks
- ✅ Fixed pipeline result index (removed redundant SETEX)

### 3. Enhanced Logging
- Added dedup key logging for debugging
- Added "first view confirmed" messages
- Added "duplicate detected" warnings with user info

## Testing

### Before Fix
```
[Redis] Successfully tracked chapter view: xxx, buffered count: 1
[Redis] Successfully tracked chapter view: xxx, buffered count: 2  ❌ DUPLICATE
```

### After Fix
```
[Redis] Checking dedup key: views:dedup:user:chapter:userId:chapterId
[Redis] First view confirmed for chapter xxx, proceeding to track
[Redis] Successfully tracked chapter view: xxx, buffered count: 1

# Second request (duplicate)
[Redis] Checking dedup key: views:dedup:user:chapter:userId:chapterId
[Redis] Duplicate view detected for chapter xxx, user: userId, skipping  ✅ BLOCKED
```

## How to Verify

1. **Restart your dev server** to load the new code:
   ```bash
   npm run dev
   ```

2. **Visit a chapter page** while logged in

3. **Refresh the page immediately** (within 24 hours)

4. **Check server logs** - you should see:
   - First visit: "First view confirmed"
   - Second visit: "Duplicate view detected, skipping"

5. **Check Redis buffer:**
   ```bash
   redis-cli -h 192.168.29.200 -p 6379 -a 123456789 GET "views:chapter:buffer:CHAPTER_ID"
   ```
   Should return `"1"` even after multiple refreshes

## Technical Details

### Redis SET Command with NX

```
SET key value [EX seconds] [NX]
```

- `EX seconds`: Set expiry time
- `NX`: Only set if key does NOT exist
- Returns: `'OK'` if set, `null` if key already exists

This is Redis's recommended way to implement distributed locks and deduplication.

### Deduplication Keys

- **Logged-in users**: `views:dedup:user:chapter:{userId}:{chapterId}`
- **Anonymous users**: `views:dedup:ip:chapter:{ip}:{chapterId}`
- **TTL**: 24 hours (configurable via `VIEW_DEDUP_TTL_HOURS`)

### Performance Impact

- **Before**: 2 Redis calls (EXISTS + SETEX in pipeline)
- **After**: 1 Redis call (SET ... NX)
- **Result**: Slightly faster + race-condition free ✅

## Related Files

- `src/lib/redis/view-tracking.ts` - Main fix
- `src/services/view-service.ts` - Uses the tracking functions
- `src/app/api/stories/[id]/chapters/[chapterId]/route.ts` - API endpoint

## References

- [Redis SET command documentation](https://redis.io/commands/set/)
- [Redis distributed locks pattern](https://redis.io/docs/manual/patterns/distributed-locks/)
