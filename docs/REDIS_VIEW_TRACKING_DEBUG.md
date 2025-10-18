# Redis View Tracking - Debugging Guide

## Issues Reported

### 1. Showing "anonymous" instead of user ID when logged in
### 2. Inconsistent view counting (sometimes story, sometimes chapter)

---

## Issue 1: Anonymous User When Logged In

### Possible Causes

#### A. Session Not Being Retrieved
The most likely cause is that `getServerSession(authOptions)` is returning `null` or the session doesn't have a `user.id`.

**Check your server logs for:**
```
[ViewService] Attempting to track story view via Redis: xxx, userId: NOT PROVIDED
```

If you see "NOT PROVIDED", the session is not working.

#### B. Session Provider Issue
If you're seeing the SessionProvider error we saw earlier, the session might not be available in API routes.

#### C. Cookie/Auth Issues
- Cookies not being sent with requests
- CORS issues
- Auth token expired

### How to Debug

**Step 1: Add session logging to the API route**

Add this to `src/app/api/stories/by-slug/[slug]/route.ts` after line 18:

```typescript
const session = await getServerSession(authOptions);
console.log('[DEBUG] Session:', {
  hasSession: !!session,
  hasUser: !!session?.user,
  userId: session?.user?.id,
  userEmail: session?.user?.email,
});
```

**Step 2: Check the logs**

When you visit a story page while logged in, check your server terminal for:
```
[DEBUG] Session: { hasSession: true, hasUser: true, userId: 'clxxx...', userEmail: 'user@example.com' }
```

If `hasSession: false`, your session is not working.

**Step 3: Verify you're actually logged in**

- Open browser DevTools → Application → Cookies
- Look for `next-auth.session-token` or `__Secure-next-auth.session-token`
- If missing, you're not logged in

---

## Issue 2: Inconsistent View Counting

This is **EXPECTED BEHAVIOR** due to deduplication. Here's why:

### How Deduplication Works

**Deduplication Window: 24 hours**

When you view a story/chapter:
1. ✅ **First view** → Counted and tracked in Redis
2. ❌ **Second view (within 24h)** → Detected as duplicate, NOT counted
3. ❌ **Third view (within 24h)** → Detected as duplicate, NOT counted
4. ✅ **View after 24h** → Counted again (dedup key expired)

### Why It Seems Inconsistent

#### Scenario 1: Story counted, chapter not counted
```
1. You view Story A → ✅ Counted (first time)
2. You view Chapter 1 of Story A → ✅ Chapter counted, ❌ Story NOT counted (duplicate)
```

The story view was already tracked when you viewed the story page, so when you view a chapter, the chapter is counted but the story is not (because it's a duplicate within 24h).

#### Scenario 2: One chapter counted, second not counted
```
1. You view Chapter 1 → ✅ Counted (first time)
2. You immediately view Chapter 2 → ✅ Counted (different chapter)
3. You refresh Chapter 1 → ❌ NOT counted (duplicate of step 1)
4. You refresh Chapter 2 → ❌ NOT counted (duplicate of step 2)
```

Each chapter has its own deduplication key, but refreshing the same chapter within 24h won't count.

### Deduplication Keys

**For logged-in users:**
- Story: `views:dedup:user:story:{userId}:{storyId}`
- Chapter: `views:dedup:user:chapter:{userId}:{chapterId}`

**For anonymous users:**
- Story: `views:dedup:ip:story:{ip}:{storyId}`
- Chapter: `views:dedup:ip:chapter:{ip}:{chapterId}`

### Check Deduplication Keys in Redis

```bash
# List all deduplication keys
redis-cli -h 192.168.29.200 -p 6379 -a 123456789 KEYS "views:dedup:*"

# Check a specific dedup key
redis-cli -h 192.168.29.200 -p 6379 -a 123456789 GET "views:dedup:user:story:YOUR_USER_ID:STORY_ID"

# Check TTL (time to live) of a dedup key
redis-cli -h 192.168.29.200 -p 6379 -a 123456789 TTL "views:dedup:user:story:YOUR_USER_ID:STORY_ID"
```

If the key exists and TTL > 0, that view will be considered a duplicate.

---

## Expected Log Patterns

### First View (Logged In)
```
[ViewService] Attempting to track story view via Redis: xxx, userId: clxxx..., ip: 192.168.x.x
[Redis] Checking dedup key: views:dedup:user:story:clxxx...:storyId
[Redis] First view confirmed for story xxx, proceeding to track
[Redis] Successfully tracked story view: xxx, buffered count: 1, user: clxxx...
```

### Duplicate View (Logged In)
```
[ViewService] Attempting to track story view via Redis: xxx, userId: clxxx..., ip: 192.168.x.x
[Redis] Checking dedup key: views:dedup:user:story:clxxx...:storyId
[Redis] Duplicate view detected for story xxx, user: clxxx..., skipping
```

### First View (Anonymous)
```
[ViewService] Attempting to track story view via Redis: xxx, userId: NOT PROVIDED, ip: 192.168.x.x
[Redis] Checking dedup key: views:dedup:ip:story:192.168.x.x:storyId
[Redis] First view confirmed for story xxx, proceeding to track
[Redis] Successfully tracked story view: xxx, buffered count: 1, user: anonymous
```

---

## Testing Checklist

### Test 1: Verify Session
- [ ] Add session logging to API route
- [ ] Visit a story page while logged in
- [ ] Check server logs for session details
- [ ] Verify `userId` is present in logs

### Test 2: Verify Deduplication
- [ ] Clear Redis dedup keys: `redis-cli -h 192.168.29.200 -p 6379 -a 123456789 FLUSHDB`
- [ ] Visit a story page → Should count
- [ ] Refresh immediately → Should NOT count (duplicate)
- [ ] Check logs for "Duplicate view detected"

### Test 3: Verify Different Resources
- [ ] Visit Story A → Should count
- [ ] Visit Chapter 1 of Story A → Chapter counts, Story doesn't (duplicate)
- [ ] Visit Chapter 2 of Story A → Chapter counts, Story doesn't (duplicate)

### Test 4: Verify Anonymous vs Logged In
- [ ] Log out
- [ ] Visit a story → Should show "user: anonymous"
- [ ] Log in
- [ ] Visit the same story → Should show "user: {userId}"
- [ ] Both should be counted separately (different dedup keys)

---

## Common Misunderstandings

### ❌ "I refreshed the page and it didn't count"
✅ **Correct**: Refreshing within 24h is a duplicate and won't count.

### ❌ "I viewed Chapter 1, then Story, and Story wasn't counted"
✅ **Correct**: If you viewed the story page first, then the chapter, the story view was already counted.

### ❌ "Sometimes it counts, sometimes it doesn't"
✅ **Correct**: It depends on whether you've viewed that exact resource within the last 24 hours.

---

## How to Force Count Every View (Not Recommended)

If you want to disable deduplication for testing:

**Option 1: Reduce TTL to 1 second**
```env
VIEW_DEDUP_TTL_HOURS=0.0003  # ~1 second
```

**Option 2: Clear dedup keys before each test**
```bash
redis-cli -h 192.168.29.200 -p 6379 -a 123456789 FLUSHDB
```

**Option 3: Disable Redis view tracking**
```env
VIEW_TRACKING_REDIS_ENABLED=false
```

---

## Next Steps

1. **Add session debugging** to verify userId is being passed
2. **Check server logs** when viewing stories/chapters
3. **Understand deduplication** is working as designed
4. **Test with cleared Redis** to see fresh counts

The "inconsistent" counting is actually **consistent deduplication** working correctly!
