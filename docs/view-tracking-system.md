# View Tracking System Documentation

## Overview

The FableSpace view tracking system records user interactions with stories and chapters. It tracks views for both authenticated and anonymous users, maintains separate counts for stories and chapters, and provides optimized batch operations for analytics and dashboard features.

## Database Schema

The system uses two main tables:

### StoryView

Tracks views of stories:

```prisma
model StoryView {
  id         String   @id @default(cuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  storyId    String
  story      Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  clientIp   String?
  userAgent  String?
  isFirstView Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@unique([userId, storyId], map: "unique_user_story_view", name: "unique_user_story_view")
  @@index([userId])
  @@index([storyId])
  @@index([storyId, createdAt])
  @@index([userId, storyId])
}
```

### ChapterView

Tracks views of individual chapters:

```prisma
model ChapterView {
  id         String   @id @default(cuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  chapterId  String
  chapter    Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  clientIp   String?
  userAgent  String?
  isFirstView Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@unique([userId, chapterId], map: "unique_user_chapter_view", name: "unique_user_chapter_view")
  @@index([userId])
  @@index([chapterId])
  @@index([chapterId, createdAt])
  @@index([userId, chapterId])
}
```

## Business Rules

1. **Authenticated Users**:
   - For logged-in users, we track one view per story/chapter per user
   - The unique constraint ensures we don't count multiple views from the same user
   - The `readCount` is only incremented on the first view
   - The `isFirstView` flag is set to `true` for the first view

2. **Anonymous Users**:
   - For anonymous users, we track each view separately
   - We use IP address and user agent to identify anonymous users
   - We avoid counting multiple views from the same anonymous user within 24 hours
   - Each new anonymous view increments the `readCount`
   - The `isFirstView` flag is set to `true` for new anonymous views

3. **Story vs. Chapter Views**:
   - By default, viewing a chapter can optionally trigger a story view
   - This behavior is configurable via the `trackStoryView` parameter
   - The default is `true` to ensure story view counts are accurate

4. **Read Count**:
   - Each story and chapter has a `readCount` field that represents the total number of unique views
   - This count is incremented when a new view is recorded
   - For authenticated users, this only happens on their first view

## Implementation Details

### Race Condition Prevention

The system uses database transactions to prevent race conditions:

1. For authenticated users, we use an atomic upsert operation:
   - This either creates a new view or returns the existing one
   - The read count is only incremented if a new view was created (isFirstView = true)

2. For anonymous users, we check for existing views within the last 24 hours:
   - If a view exists, we use it and don't increment the read count
   - If no view exists, we create a new one and increment the read count

### View Tracking Process

1. When a user views a story or chapter, the system:
   - Checks if the user is authenticated
   - For authenticated users, uses upsert to create/find a view
   - For anonymous users, checks for recent views before creating a new one
   - Updates the read count as appropriate

2. When a chapter is viewed, the system can optionally:
   - Also track a view for the parent story
   - This is controlled by the `trackStoryView` parameter

### Batch Operations

For dashboard and analytics, the system provides batch operations:

1. `getBatchStoryViewCounts`: Gets view counts for multiple stories in a single query
2. `getBatchChapterViewCounts`: Gets view counts for multiple chapters in a single query
3. `getMostViewedStories`: Gets the most viewed stories with optional time filtering

### Time-Based Filtering

All view count methods support time-based filtering:

1. Predefined ranges: '7days', '30days', '90days', 'year', 'all'
2. Custom date ranges using the 'custom' timeRange with startDate and endDate parameters

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
- Returns: An object containing the view record and isFirstView flag

### ViewService.trackChapterView

```typescript
static async trackChapterView(
  chapterId: string,
  userId?: string,
  clientInfo?: { ip?: string; userAgent?: string },
  trackStoryView: boolean = true
)
```

- `chapterId`: The ID of the chapter being viewed
- `userId`: The ID of the user viewing the chapter (optional for anonymous users)
- `clientInfo`: Additional client information for anonymous tracking
- `trackStoryView`: Whether to also track a view for the story (default: true)
- Returns: An object containing the view record, isFirstView flag, and storyViewResult

### ViewService.getStoryViewCount

```typescript
static async getStoryViewCount(storyId: string, timeRange?: string)
```

- `storyId`: The ID of the story
- `timeRange`: Optional time range for filtering views
- Returns: The total view count for the story

### ViewService.getChapterViewCount

```typescript
static async getChapterViewCount(chapterId: string, timeRange?: string)
```

- `chapterId`: The ID of the chapter
- `timeRange`: Optional time range for filtering views
- Returns: The total view count for the chapter

### ViewService.getBatchStoryViewCounts

```typescript
static async getBatchStoryViewCounts(
  storyIds: string[],
  timeRange?: string,
  startDate?: Date,
  endDate?: Date
)
```

- `storyIds`: Array of story IDs
- `timeRange`: Optional time range for filtering views
- `startDate`: Optional custom start date (used when timeRange is 'custom')
- `endDate`: Optional custom end date (used when timeRange is 'custom')
- Returns: Map of story ID to view count

### ViewService.getBatchChapterViewCounts

```typescript
static async getBatchChapterViewCounts(
  chapterIds: string[],
  timeRange?: string,
  startDate?: Date,
  endDate?: Date
)
```

- `chapterIds`: Array of chapter IDs
- `timeRange`: Optional time range for filtering views
- `startDate`: Optional custom start date (used when timeRange is 'custom')
- `endDate`: Optional custom end date (used when timeRange is 'custom')
- Returns: Map of chapter ID to view count

### ViewService.getMostViewedStories

```typescript
static async getMostViewedStories(
  limit: number = 10,
  timeRange?: string,
  startDate?: Date,
  endDate?: Date
)
```

- `limit`: Number of stories to return
- `timeRange`: Optional time range for filtering views
- `startDate`: Optional custom start date (used when timeRange is 'custom')
- `endDate`: Optional custom end date (used when timeRange is 'custom')
- Returns: Array of story IDs sorted by view count

## Best Practices

1. **Tracking Story Views**:
   - When a user directly views a story, use `trackStoryView`
   - When a user views a chapter, consider whether to also track a story view

2. **Anonymous Tracking**:
   - Always provide IP and user agent when available
   - Be aware of privacy implications and comply with relevant regulations

3. **Performance Considerations**:
   - Use batch operations for dashboard and analytics to reduce database load
   - Use time-based filtering for analytics and trending content
   - Avoid redundant queries by using the isFirstView flag

4. **Error Handling**:
   - Catch and log errors but don't fail the request if view tracking fails
   - Use try/catch blocks around view tracking code

5. **Database Optimization**:
   - The system uses indexes on commonly queried fields for better performance
   - The isFirstView flag eliminates the need for additional queries to check if a view is new
