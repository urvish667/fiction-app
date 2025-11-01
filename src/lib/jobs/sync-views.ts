/**
 * Background Job: Sync Buffered Views to Database
 * 
 * This job runs periodically (default: every 12 hours) to sync buffered views
 * from Redis to the database in batches.
 * 
 * Schedule: Configurable via cron expression
 * Default: "0 2,14 * * *" (2 AM and 2 PM daily)
 */

import { prisma } from '@/lib/auth/db-adapter';
import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';
import {
  getBufferedStoryViews,
  getBufferedChapterViews,
  clearStoryViewBuffer,
  clearChapterViewBuffer,
} from '@/lib/redis/view-tracking';

/**
 * Sync metrics for monitoring
 */
export interface SyncMetrics {
  startTime: Date;
  endTime: Date;
  duration: number;
  storiesProcessed: number;
  chaptersProcessed: number;
  storyViewsAdded: number;
  chapterViewsAdded: number;
  errors: number;
  success: boolean;
}

/**
 * Sync buffered story views to the database
 * @returns Number of stories updated
 */
async function syncStoryViews(): Promise<{ processed: number; viewsAdded: number; errors: number }> {
  // Check Redis connection status
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('[Redis] Redis client not available for story view sync');
    return { processed: 0, viewsAdded: 0, errors: 0 };
  }

  try {
    const status = redis.status;
    logger.info(`[Redis] Connection status for story view sync: ${status}`);
  } catch (error) {
    logger.error('[Redis] Failed to check connection status:', error);
  }

  const bufferedViews = await getBufferedStoryViews();
  
  if (bufferedViews.size === 0) {
    logger.info('No buffered story views to sync');
    return { processed: 0, viewsAdded: 0, errors: 0 };
  }

  logger.info(`Syncing ${bufferedViews.size} stories with buffered views`);

  let processed = 0;
  let viewsAdded = 0;
  let errors = 0;

  // Process in batches of 500 for efficient batch updates
  const BATCH_SIZE = 500;
  const entries = Array.from(bufferedViews.entries());
  
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    
    try {
      // Execute all updates in parallel for better performance
      // These are independent UPDATE statements, so we can run them concurrently
      await Promise.all(
        batch.map(([storyId, count]) =>
          prisma.$executeRaw`
            UPDATE "Story"
            SET "readCount" = "readCount" + ${count}
            WHERE id = ${storyId}
          `
        )
      );

      // Clear all buffers in parallel after successful update
      const clearResults = await Promise.allSettled(
        batch.map(([storyId]) => clearStoryViewBuffer(storyId))
      );

      // Count successes
      let batchProcessed = 0;
      let batchViewsAdded = 0;
      batch.forEach(([storyId, count], index) => {
        if (clearResults[index].status === 'fulfilled') {
          batchProcessed++;
          batchViewsAdded += count;
        } else {
          errors++;
          logger.error(`Failed to clear buffer for story ${storyId}:`, clearResults[index]);
        }
      });

      processed += batchProcessed;
      viewsAdded += batchViewsAdded;

      logger.info(`[Redis] Batch synced ${batchProcessed}/${batch.length} stories with ${batchViewsAdded} views`);
      
    } catch (error) {
      // If batch update fails, fall back to individual updates for this batch
      logger.warn(`[Redis] Batch update failed, falling back to individual updates:`, error);
      
      const results = await Promise.allSettled(
        batch.map(async ([storyId, count]) => {
          try {
            await prisma.$executeRaw`
              UPDATE "Story" 
              SET "readCount" = "readCount" + ${count}
              WHERE id = ${storyId}
            `;
            await clearStoryViewBuffer(storyId);
            return { storyId, count, success: true };
          } catch (error) {
            logger.error(`Failed to sync views for story ${storyId}:`, error);
            throw error;
          }
        })
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          processed++;
          viewsAdded += batch[index][1];
        } else {
          errors++;
        }
      });
    }
  }

  logger.info(`Story view sync complete: ${processed} stories, ${viewsAdded} views added, ${errors} errors`);

  return { processed, viewsAdded, errors };
}

/**
 * Sync buffered chapter views to the database
 * @returns Number of chapters updated
 */
async function syncChapterViews(): Promise<{ processed: number; viewsAdded: number; errors: number }> {
  // Check Redis connection status
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('[Redis] Redis client not available for chapter view sync');
    return { processed: 0, viewsAdded: 0, errors: 0 };
  }

  try {
    const status = redis.status;
    logger.info(`[Redis] Connection status for chapter view sync: ${status}`);
  } catch (error) {
    logger.error('[Redis] Failed to check connection status:', error);
  }

  const bufferedViews = await getBufferedChapterViews();
  
  if (bufferedViews.size === 0) {
    logger.info('No buffered chapter views to sync');
    return { processed: 0, viewsAdded: 0, errors: 0 };
  }

  logger.info(`Syncing ${bufferedViews.size} chapters with buffered views`);

  let processed = 0;
  let viewsAdded = 0;
  let errors = 0;

  // Process in batches of 500 for efficient batch updates
  const BATCH_SIZE = 500;
  const entries = Array.from(bufferedViews.entries());
  
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    
    try {
      // Execute all updates in parallel for better performance
      // These are independent UPDATE statements, so we can run them concurrently
      await Promise.all(
        batch.map(([chapterId, count]) =>
          prisma.$executeRaw`
            UPDATE "Chapter"
            SET "readCount" = "readCount" + ${count}
            WHERE id = ${chapterId}
          `
        )
      );

      // Clear all buffers in parallel after successful update
      const clearResults = await Promise.allSettled(
        batch.map(([chapterId]) => clearChapterViewBuffer(chapterId))
      );

      // Count successes
      let batchProcessed = 0;
      let batchViewsAdded = 0;
      batch.forEach(([chapterId, count], index) => {
        if (clearResults[index].status === 'fulfilled') {
          batchProcessed++;
          batchViewsAdded += count;
        } else {
          errors++;
          logger.error(`Failed to clear buffer for chapter ${chapterId}:`, clearResults[index]);
        }
      });

      processed += batchProcessed;
      viewsAdded += batchViewsAdded;

      logger.info(`[Redis] Batch synced ${batchProcessed}/${batch.length} chapters with ${batchViewsAdded} views`);
      
    } catch (error) {
      // If batch update fails, fall back to individual updates for this batch
      logger.warn(`[Redis] Batch update failed, falling back to individual updates:`, error);
      
      const results = await Promise.allSettled(
        batch.map(async ([chapterId, count]) => {
          try {
            await prisma.$executeRaw`
              UPDATE "Chapter" 
              SET "readCount" = "readCount" + ${count}
              WHERE id = ${chapterId}
            `;
            await clearChapterViewBuffer(chapterId);
            return { chapterId, count, success: true };
          } catch (error) {
            logger.error(`Failed to sync views for chapter ${chapterId}:`, error);
            throw error;
          }
        })
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          processed++;
          viewsAdded += batch[index][1];
        } else {
          errors++;
        }
      });
    }
  }

  logger.info(`Chapter view sync complete: ${processed} chapters, ${viewsAdded} views added, ${errors} errors`);

  return { processed, viewsAdded, errors };
}

/**
 * Main sync job function
 * This is the entry point for the cron job
 */
export async function syncBufferedViews(): Promise<SyncMetrics> {
  const startTime = new Date();
  
  logger.info('Starting buffered view sync job');

  // Check Redis connection at the start
  const redis = getRedisClient();
  if (redis) {
    try {
      const status = redis.status;
      logger.info(`[Redis] Connection status at sync start: ${status}`);
      
      // Test Redis connectivity with a ping
      const pingResult = await redis.ping();
      logger.info(`[Redis] Ping test result: ${pingResult}`);
    } catch (error) {
      logger.error('[Redis] Failed to verify Redis connection:', error);
    }
  } else {
    logger.warn('[Redis] Redis client not available - sync job will not process any views');
  }

  try {
    // Sync stories and chapters in parallel
    const [storyResults, chapterResults] = await Promise.all([
      syncStoryViews(),
      syncChapterViews(),
    ]);

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const metrics: SyncMetrics = {
      startTime,
      endTime,
      duration,
      storiesProcessed: storyResults.processed,
      chaptersProcessed: chapterResults.processed,
      storyViewsAdded: storyResults.viewsAdded,
      chapterViewsAdded: chapterResults.viewsAdded,
      errors: storyResults.errors + chapterResults.errors,
      success: true,
    };

    logger.info('Buffered view sync job completed', {
      duration: `${duration}ms`,
      storiesProcessed: metrics.storiesProcessed,
      chaptersProcessed: metrics.chaptersProcessed,
      totalViewsAdded: metrics.storyViewsAdded + metrics.chapterViewsAdded,
      errors: metrics.errors,
    });

    return metrics;
  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    logger.error('Buffered view sync job failed:', error);

    return {
      startTime,
      endTime,
      duration,
      storiesProcessed: 0,
      chaptersProcessed: 0,
      storyViewsAdded: 0,
      chapterViewsAdded: 0,
      errors: 1,
      success: false,
    };
  }
}

/**
 * Manual trigger for the sync job (for testing or emergency sync)
 * This can be called from an API endpoint
 */
export async function triggerManualSync(): Promise<SyncMetrics> {
  logger.info('Manual sync triggered');
  return await syncBufferedViews();
}
