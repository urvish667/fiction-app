# Reading Progress Optimization

This document outlines the optimizations made to the reading progress functionality in FableSpace.

## Overview

The reading progress functionality allows users to track their progress when reading chapters and resume from where they left off. However, it can cause performance issues if not properly optimized.

## Optimizations Implemented

### 1. Database Indexes

The `ReadingProgress` table has the following indexes to improve query performance:

```prisma
model ReadingProgress {
  id        String   @id @default(cuid())
  progress  Float    @default(0)
  userId    String
  chapterId String
  lastRead  DateTime @default(now())
  chapter   Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])

  @@unique([userId, chapterId])
  @@index([userId])
  @@index([chapterId])
}
```

### 2. API Endpoint Optimizations

#### Reading Progress API

- Added pagination to limit the number of records returned
- Added a limit parameter to control the page size
- Added pagination metadata to the response

#### Chapters API

- Limited the reading progress query to only fetch records for the chapters being displayed
- Used a more efficient query with the `in` operator

#### Single Chapter API

- Skip reading progress tracking for the author of the story
- Only create a reading progress record if the user is not the author

### 3. Client-Side Optimizations

- Increased the debounce threshold from 5% to 10% to reduce the number of API calls
- Skip reading progress tracking for the author of the story
- Added additional checks to prevent unnecessary API calls

### 4. Cleanup Jobs

Created a cleanup system to periodically remove old and unnecessary reading progress records:

1. **Completed Reading Progress Cleanup**
   - Removes reading progress records that are older than 90 days and have a progress of 100%

2. **Per-User Limit**
   - Limits the number of reading progress records per user to 100
   - Keeps only the most recent records

3. **Duplicate Cleanup**
   - Removes duplicate reading progress records for the same user and chapter

## Usage

### Running the Cleanup Job

The cleanup job can be run manually using:

```bash
npm run cleanup-reading-progress
```

### Scheduling the Cleanup Job

For production environments, it's recommended to schedule the cleanup job to run periodically (e.g., once a week) using a cron job or a similar scheduling system.

Example cron entry to run the job every Sunday at 3 AM:

```
0 3 * * 0 cd /path/to/app && npm run cleanup-reading-progress
```

## Performance Impact

These optimizations significantly reduce the database load and improve the performance of the reading progress functionality:

1. Reduced the number of database queries
2. Limited the amount of data fetched from the database
3. Reduced the number of API calls from the client
4. Periodically cleaned up old and unnecessary data

## Future Improvements

1. Consider implementing a Redis-based caching system for frequently accessed reading progress data
2. Implement a batch processing system for reading progress updates
3. Consider moving reading progress data to a separate database for better scalability
