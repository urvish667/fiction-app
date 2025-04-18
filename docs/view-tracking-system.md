# View Tracking System Documentation

## Overview

The FableSpace view tracking system records user interactions with stories and chapters. It tracks views for both authenticated and anonymous users, and maintains separate counts for stories and chapters.

## Database Schema

The system uses two main tables:

### StoryView

Tracks views of stories:

```prisma
model StoryView {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  storyId   String
  story     Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  clientIp  String?
  userAgent String?
  createdAt DateTime @default(now())

  @@unique([userId, storyId], map: "unique_user_story_view", name: "unique_user_story_view")
  @@index([userId])
  @@index([storyId])
}
```

### ChapterView

Tracks views of individual chapters:

```prisma
model ChapterView {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  chapterId String
  chapter   Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  clientIp  String?
  userAgent String?
  createdAt DateTime @default(now())

  @@unique([userId, chapterId], map: "unique_user_chapter_view", name: "unique_user_chapter_view")
  @@index([userId])
  @@index([chapterId])
}
```

## Business Rules

1. **Authenticated Users**:
   - For logged-in users, we track one view per story/chapter per user
   - The unique constraint ensures we don't count multiple views from the same user
   - The `readCount` is only incremented on the first view

2. **Anonymous Users**:
   - For anonymous users, we track each view separately
   - We use IP address and user agent to identify anonymous users
   - Each anonymous view increments the `readCount`

3. **Story vs. Chapter Views**:
   - By default, viewing a chapter can optionally trigger a story view
   - This behavior is configurable via the `trackStoryView` parameter
   - The default is `false` to avoid inflating story view counts

4. **Read Count**:
   - Each story and chapter has a `readCount` field that represents the total number of unique views
   - This count is incremented when a new view is recorded
   - For authenticated users, this only happens on their first view

## Implementation Details

### Race Condition Prevention

The system uses database transactions to prevent race conditions:

1. For authenticated users, we use an atomic upsert operation:
   - This either creates a new view or returns the existing one
   - The read count is only incremented if a new view was created

2. For anonymous users, we always create a new view and increment the read count

### View Tracking Process

1. When a user views a story or chapter, the system:
   - Checks if the user is authenticated
   - For authenticated users, uses upsert to create/find a view
   - For anonymous users, creates a new view
   - Updates the read count as appropriate

2. When a chapter is viewed, the system can optionally:
   - Also track a view for the parent story
   - This is controlled by the `trackStoryView` parameter

## API

### ViewService.trackStoryView

```typescript
static async trackStoryView(
  storyId: string,
  userId?: string,
  clientInfo?: { ip?: string; userAgent?: string },
  incrementReadCount: boolean = true
)
```

- `storyId`: The ID of the story being viewed
- `userId`: The ID of the user viewing the story (optional for anonymous users)
- `clientInfo`: Additional client information for anonymous tracking
- `incrementReadCount`: Whether to increment the story's read count (default: true)

### ViewService.trackChapterView

```typescript
static async trackChapterView(
  chapterId: string,
  userId?: string,
  clientInfo?: { ip?: string; userAgent?: string },
  trackStoryView: boolean = false
)
```

- `chapterId`: The ID of the chapter being viewed
- `userId`: The ID of the user viewing the chapter (optional for anonymous users)
- `clientInfo`: Additional client information for anonymous tracking
- `trackStoryView`: Whether to also track a view for the story (default: false)

### ViewService.getStoryViewCount

```typescript
static async getStoryViewCount(storyId: string)
```

- `storyId`: The ID of the story
- Returns the total view count for the story

### ViewService.getChapterViewCount

```typescript
static async getChapterViewCount(chapterId: string)
```

- `chapterId`: The ID of the chapter
- Returns the total view count for the chapter

## Best Practices

1. **Tracking Story Views**:
   - When a user directly views a story, use `trackStoryView`
   - When a user views a chapter, consider whether to also track a story view

2. **Anonymous Tracking**:
   - Always provide IP and user agent when available
   - Be aware of privacy implications and comply with relevant regulations

3. **Performance Considerations**:
   - The system uses transactions which may impact performance under high load
   - Consider implementing caching for view counts if needed
