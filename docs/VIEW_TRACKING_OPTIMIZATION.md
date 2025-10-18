# View Tracking Optimization & Session Fix

## Date
October 18, 2025

## Issues Fixed

### 1. Database Flooding from Individual View Records

**Problem**: The system was storing **every single view** as an individual row in `StoryView` and `ChapterView` tables, even when Redis tracking succeeded. This would lead to:
- Millions of rows with high traffic
- Large index sizes
- Slow queries
- High storage costs
- Redundant data (views counted twice: in DB tables AND in `readCount` fields)

**Solution**: Refactored `ViewService` to use **Redis as primary tracking** with DB tables only as fallback:

#### Changes in `src/services/view-service.ts`:

**Before**:
```typescript
// Redis tracking succeeded, but still created individual DB records
if (redisResult.success) {
  // ... Redis tracking logic
  return { view: null, isFirstView, viewCount };
}
// Then fallback to DB
```

**After**:
```typescript
if (redisResult.success) {
  // IMPORTANT: When Redis succeeds, we DO NOT create individual view records in DB
  // This prevents database flooding. Views are aggregated in Redis and synced to readCount periodically.
  return {
    view: null, // No individual DB record created
    isFirstView: redisResult.isFirstView,
    viewCount,
  };
}

// FALLBACK ONLY: If Redis tracking failed completely, fall back to direct database tracking
// This creates individual records (legacy behavior) only when Redis is unavailable
logger.warn('Redis tracking failed, falling back to database with individual records (legacy mode)');
```

#### How It Works Now:

1. **Primary Path (Redis available)**:
   - Views tracked in Redis with deduplication (24-hour TTL)
   - Views buffered in Redis counters
   - No individual DB records created
   - Periodically synced to `readCount` fields via background job

2. **Fallback Path (Redis unavailable)**:
   - Falls back to legacy behavior
   - Creates individual `StoryView`/`ChapterView` records
   - Increments `readCount` immediately
   - Only used when Redis is down

### 2. Session Cookie Issue in Server Components

**Problem**: Session was not available in API routes when called from server-side rendering:
```
[DEBUG] Session Details: {
  hasSession: false,
  hasUser: false,
  userId: undefined,
  cookieCount: 0
}
```

**Root Cause**: 
- `generateMetadata()` in `page.tsx` called `StoryService.getStoryBySlug()`
- This made a fetch request to the API route `/api/stories/by-slug/[slug]`
- During SSR, cookies weren't properly passed in the fetch request
- `getServerSession()` in the API route returned null

**Solution**: Query database directly in server components instead of using API routes:

#### Changes in `src/app/story/[slug]/page.tsx`:

**Before**:
```typescript
export async function generateMetadata({ params }: StoryPageProps) {
  const { slug } = await params
  const story = await StoryService.getStoryBySlug(slug) // ❌ API call, no cookies
  // ...
}
```

**After**:
```typescript
export async function generateMetadata({ params }: StoryPageProps) {
  const { slug } = await params
  
  // Query database directly instead of using API route to avoid session/cookie issues during SSR
  const story = await prisma.story.findUnique({
    where: { slug },
    include: { /* ... */ },
  });
  // ✅ Direct DB access, no API call needed
}
```

Also applied same fix to chapter fetching:
```typescript
// Before: const chaptersData = await StoryService.getChapters(story.id)
// After: Direct DB query
const chaptersData = await prisma.chapter.findMany({
  where: { storyId: story.id },
  orderBy: { number: 'asc' },
});
```

## Benefits

### View Tracking Optimization:
1. **Massive reduction in DB writes**: Only periodic batch updates instead of one write per view
2. **No more redundant data**: Views counted once in Redis, synced to `readCount`
3. **Faster response times**: Redis operations are much faster than DB writes
4. **Scalability**: Can handle millions of views without DB performance degradation
5. **Legacy data preserved**: Existing `StoryView`/`ChapterView` records remain intact for analytics

### Session Fix:
1. **Proper session handling**: Server components get session correctly via `getServerSession()`
2. **No unnecessary API calls**: Direct DB queries in server components are more efficient
3. **Better SEO**: Metadata generation works correctly with user context
4. **Reduced latency**: One less HTTP round-trip during SSR

## Database Tables Status

### StoryView & ChapterView Tables:
- **Status**: Kept in database (not deleted)
- **Purpose**: 
  - Contains historical view data from production
  - Used as fallback when Redis is unavailable
  - Can be used for analytics/reporting
  - **New views are NOT written here** when Redis is working

### Recommended Future Actions:
1. **Analytics**: Query existing records for historical analytics
2. **Cleanup**: Eventually archive old records (>1 year) to reduce table size
3. **Monitoring**: Set up alerts if system starts falling back to DB frequently
4. **Background Job**: Ensure Redis-to-DB sync job is running properly

## Configuration

View tracking is controlled by environment variables:
```env
# Enable Redis-based view tracking (default: false)
VIEW_TRACKING_REDIS_ENABLED=true

# Deduplication window in hours (default: 24)
VIEW_DEDUP_TTL_HOURS=24

# How often to sync buffered views to DB in hours (default: 12)
VIEW_SYNC_INTERVAL_HOURS=12
```

## Testing Checklist

- [ ] Verify views are tracked in Redis when users visit stories/chapters
- [ ] Confirm no new rows in `StoryView`/`ChapterView` tables when Redis is working
- [ ] Check that `readCount` is updated periodically by background sync job
- [ ] Test fallback: Stop Redis and verify DB fallback works
- [ ] Verify session works correctly in story pages
- [ ] Confirm metadata generation has proper user context

## Files Modified

1. `src/services/view-service.ts` - Refactored to use Redis primarily
2. `src/app/story/[slug]/page.tsx` - Fixed session by using direct DB queries
3. `docs/VIEW_TRACKING_OPTIMIZATION.md` - This documentation

## Related Documentation

- `docs/REDIS_VIEW_TRACKING_DEBUG.md` - Redis troubleshooting guide
- `REDIS_OPTIMIZATION_SUMMARY.md` - Overall Redis strategy
