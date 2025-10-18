# Redis View Tracking - Testing Guide

## ✅ Redis Connection Status
Your Redis is **CONNECTED** and working! Test confirmed:
- Host: 192.168.29.200:6379
- Connection: ✅ PONG
- View tracking enabled: ✅ true

## What Changed

The `ViewService` now:
1. **Tries Redis first** - Attempts to track views in Redis
2. **Falls back to database** - If Redis fails, uses direct DB writes
3. **Logs everything** - You'll see detailed logs in your server terminal

## How to See Logs

### Step 1: Add Missing Environment Variable

Add this to your `.env` file:
```env
REDIS_ENABLED=true
```

### Step 2: Restart Your Dev Server

**IMPORTANT:** You must restart after changing `.env`

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Track a View

Visit any story page in your browser, or use curl:

```bash
# Get a story (this will track a view)
curl http://localhost:3000/api/stories/YOUR_STORY_ID
```

### Step 4: Check Server Terminal Logs

Look for these logs in your **server terminal** (not browser console):

```
[ViewService] Attempting to track story view via Redis: abc123
[Redis] Connection status for story view tracking: ready
[Redis] Successfully tracked story view: abc123, buffered count: 1, user: anonymous
[ViewService] Successfully tracked story view in Redis: abc123, buffered: 1
```

### Step 5: Verify in Redis

Check if the view was buffered in Redis:

```bash
# From your Windows machine
docker run --rm -it redis:latest redis-cli -h 192.168.29.200 -p 6379 -a 123456789 GET "views:story:buffer:YOUR_STORY_ID"
```

Expected output: `"1"` (or higher if you tracked multiple views)

## Testing Checklist

- [ ] Added `REDIS_ENABLED=true` to `.env`
- [ ] Restarted dev server
- [ ] Visited a story page or made API call
- [ ] Checked server terminal for `[ViewService]` and `[Redis]` logs
- [ ] Verified buffer in Redis using redis-cli
- [ ] Waited for sync job or manually triggered it

## Manual Sync Test

To manually sync views from Redis to database:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/sync-views
```

You should see logs like:
```
[Redis] Connection status at sync start: ready
[Redis] Ping test result: PONG
[Redis] Retrieved 5 buffered story views from Redis
[Redis] Updated story abc123 in database with 3 views
[Redis] Cleared Redis buffer for story abc123
```

## Common Issues

### Issue: No logs appearing
**Solution:** 
1. Ensure `REDIS_ENABLED=true` is in `.env`
2. Restart dev server after changing `.env`
3. Check you're looking at **server terminal**, not browser console

### Issue: Still getting (nil) from redis-cli
**Solution:**
1. Make sure you restarted the dev server
2. Actually visit a story page to trigger view tracking
3. Use the correct story ID from your database
4. Check immediately after tracking (before sync job runs)

### Issue: Logs show "Redis tracking failed"
**Solution:**
1. Run `node test-redis-connection.js` again
2. Check if Redis container is still running
3. Verify network connectivity

## Log Locations

### Development Mode
- **Server logs**: Terminal where you run `npm run dev`
- **Browser logs**: Browser DevTools Console (won't show Redis logs)

### Production Mode
- Check your deployment platform's logs (Vercel, Railway, etc.)

## Expected Behavior

1. **First view of a story/chapter**: 
   - Tracked in Redis with deduplication key
   - Buffered count increments
   - Returns `isFirstView: true`

2. **Duplicate view (within 24 hours)**:
   - Detected by deduplication
   - Not counted
   - Returns `isFirstView: false`

3. **Sync job runs (every 12 hours)**:
   - Reads all buffered views from Redis
   - Updates database in batches
   - Clears Redis buffers
   - Logs each operation

## Quick Test Script

Create a test file `test-view-tracking.js`:

```javascript
const fetch = require('node-fetch');

async function testViewTracking() {
  // Replace with your actual story ID
  const storyId = 'YOUR_STORY_ID';
  
  console.log('Tracking view for story:', storyId);
  
  const response = await fetch(`http://localhost:3000/api/stories/${storyId}`);
  const data = await response.json();
  
  console.log('Response:', data);
  console.log('Check your server terminal for [ViewService] and [Redis] logs');
}

testViewTracking();
```

Run it:
```bash
node test-view-tracking.js
```
