/**
 * Redis-based View Tracking Service
 * 
 * This service provides buffered view tracking using Redis to reduce database load.
 * Views are stored in Redis and periodically synced to the database in batches.
 * 
 * Key Features:
 * - Instant view tracking with Redis INCR
 * - Deduplication for same user/IP within 24 hours
 * - Batch database updates (configurable interval)
 * - Real-time view counts from Redis
 * - Graceful fallback to direct DB writes if Redis fails
 */

import { getRedisClient, REDIS_KEYS } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/auth/db-adapter';

/**
 * Redis key prefixes for view tracking
 */
export const VIEW_REDIS_KEYS = {
  // Buffered view counters
  STORY_BUFFER: 'views:story:buffer:',
  CHAPTER_BUFFER: 'views:chapter:buffer:',
  
  // Last sync timestamps
  STORY_LAST_SYNC: 'views:story:last_sync:',
  CHAPTER_LAST_SYNC: 'views:chapter:last_sync:',
  
  // Deduplication keys (with TTL)
  USER_STORY_DEDUP: 'views:dedup:user:story:',
  USER_CHAPTER_DEDUP: 'views:dedup:user:chapter:',
  IP_STORY_DEDUP: 'views:dedup:ip:story:',
  IP_CHAPTER_DEDUP: 'views:dedup:ip:chapter:',
  
  // Real-time view counts (cached from DB + buffer)
  STORY_COUNT_CACHE: 'views:story:count:',
  CHAPTER_COUNT_CACHE: 'views:chapter:count:',
};

/**
 * Configuration for view tracking
 */
export const VIEW_TRACKING_CONFIG = {
  // Deduplication TTL (24 hours)
  DEDUP_TTL: parseInt(process.env.VIEW_DEDUP_TTL_HOURS || '24', 10) * 60 * 60,
  
  // View count cache TTL (5 minutes)
  COUNT_CACHE_TTL: 5 * 60,
  
  // Sync interval (12 hours default)
  SYNC_INTERVAL_HOURS: parseInt(process.env.VIEW_SYNC_INTERVAL_HOURS || '12', 10),
  
  // Whether Redis view tracking is enabled
  ENABLED: process.env.VIEW_TRACKING_REDIS_ENABLED === 'true',
};

/**
 * Track a story view in Redis
 * @param storyId The ID of the story being viewed
 * @param userId The ID of the user viewing the story (optional for anonymous users)
 * @param clientInfo Additional client information for anonymous tracking
 * @returns Whether the view was tracked successfully
 */
export async function trackStoryViewRedis(
  storyId: string,
  userId?: string,
  clientInfo?: { ip?: string; userAgent?: string }
): Promise<{ success: boolean; isFirstView: boolean; bufferedCount: number }> {
  const redis = getRedisClient();
  
  // If Redis is not available or disabled, return failure (caller should fallback to DB)
  if (!redis) {
    logger.warn('[Redis] Redis client not available for tracking story view');
    return { success: false, isFirstView: false, bufferedCount: 0 };
  }

  if (!VIEW_TRACKING_CONFIG.ENABLED) {
    logger.debug('[Redis] View tracking is disabled');
    return { success: false, isFirstView: false, bufferedCount: 0 };
  }

  try {
    const status = redis.status;
    logger.debug(`[Redis] Connection status for story view tracking: ${status}`);
  } catch (error) {
    logger.error('[Redis] Failed to check connection status:', error);
  }

  try {
    // Check for deduplication
    const dedupKey = userId
      ? `${VIEW_REDIS_KEYS.USER_STORY_DEDUP}${userId}:${storyId}`
      : clientInfo?.ip
      ? `${VIEW_REDIS_KEYS.IP_STORY_DEDUP}${clientInfo.ip}:${storyId}`
      : null;

    if (!dedupKey) {
      // No way to deduplicate, skip tracking
      logger.warn(`[Redis] No deduplication key available for story ${storyId}`);
      return { success: false, isFirstView: false, bufferedCount: 0 };
    }

    logger.debug(`[Redis] Checking dedup key: ${dedupKey}`);

    // Use SETNX (SET if Not eXists) for atomic deduplication check and set
    // This prevents race conditions where two requests come in simultaneously
    const wasSet = await redis.set(dedupKey, '1', 'EX', VIEW_TRACKING_CONFIG.DEDUP_TTL, 'NX');
    const isFirstView = wasSet === 'OK';

    if (!isFirstView) {
      // This is a duplicate view within the dedup window, don't count it
      logger.info(`[Redis] Duplicate view detected for story ${storyId}, user: ${userId || 'anonymous'}, skipping`);
      
      // Still return the current buffered count
      const bufferKey = `${VIEW_REDIS_KEYS.STORY_BUFFER}${storyId}`;
      const bufferedCount = parseInt(await redis.get(bufferKey) || '0', 10);
      
      return { success: true, isFirstView: false, bufferedCount };
    }

    logger.debug(`[Redis] First view confirmed for story ${storyId}, proceeding to track`);

    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();

    // Note: Deduplication key already set with SETNX above
    // Just increment the buffer and invalidate cache
    const bufferKey = `${VIEW_REDIS_KEYS.STORY_BUFFER}${storyId}`;
    pipeline.incr(bufferKey);

    // Invalidate cached view count
    const countCacheKey = `${VIEW_REDIS_KEYS.STORY_COUNT_CACHE}${storyId}`;
    pipeline.del(countCacheKey);

    // Execute pipeline
    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    // Get the incremented count from the INCR result (now at index 0 since we removed SETEX)
    const bufferedCount = results[0][1] as number;

    logger.info(`[Redis] Successfully tracked story view: ${storyId}, buffered count: ${bufferedCount}, user: ${userId || 'anonymous'}`);
    logger.debug(`Tracked story view in Redis: ${storyId}, buffered count: ${bufferedCount}`);

    return { success: true, isFirstView: true, bufferedCount };
  } catch (error) {
    logger.error('Failed to track story view in Redis:', error);
    return { success: false, isFirstView: false, bufferedCount: 0 };
  }
}

/**
 * Track a chapter view in Redis
 * @param chapterId The ID of the chapter being viewed
 * @param userId The ID of the user viewing the chapter (optional for anonymous users)
 * @param clientInfo Additional client information for anonymous tracking
 * @returns Whether the view was tracked successfully
 */
export async function trackChapterViewRedis(
  chapterId: string,
  userId?: string,
  clientInfo?: { ip?: string; userAgent?: string }
): Promise<{ success: boolean; isFirstView: boolean; bufferedCount: number }> {
  const redis = getRedisClient();
  
  // If Redis is not available or disabled, return failure (caller should fallback to DB)
  if (!redis) {
    logger.warn('[Redis] Redis client not available for tracking chapter view');
    return { success: false, isFirstView: false, bufferedCount: 0 };
  }

  if (!VIEW_TRACKING_CONFIG.ENABLED) {
    logger.debug('[Redis] View tracking is disabled');
    return { success: false, isFirstView: false, bufferedCount: 0 };
  }

  try {
    const status = redis.status;
    logger.debug(`[Redis] Connection status for chapter view tracking: ${status}`);
  } catch (error) {
    logger.error('[Redis] Failed to check connection status:', error);
  }

  try {
    // Check for deduplication
    const dedupKey = userId
      ? `${VIEW_REDIS_KEYS.USER_CHAPTER_DEDUP}${userId}:${chapterId}`
      : clientInfo?.ip
      ? `${VIEW_REDIS_KEYS.IP_CHAPTER_DEDUP}${clientInfo.ip}:${chapterId}`
      : null;

    if (!dedupKey) {
      // No way to deduplicate, skip tracking
      logger.warn(`[Redis] No deduplication key available for chapter ${chapterId}`);
      return { success: false, isFirstView: false, bufferedCount: 0 };
    }

    logger.debug(`[Redis] Checking dedup key: ${dedupKey}`);

    // Use SETNX (SET if Not eXists) for atomic deduplication check and set
    // This prevents race conditions where two requests come in simultaneously
    const wasSet = await redis.set(dedupKey, '1', 'EX', VIEW_TRACKING_CONFIG.DEDUP_TTL, 'NX');
    const isFirstView = wasSet === 'OK';

    if (!isFirstView) {
      // This is a duplicate view within the dedup window, don't count it
      logger.info(`[Redis] Duplicate view detected for chapter ${chapterId}, user: ${userId || 'anonymous'}, skipping`);
      
      // Still return the current buffered count
      const bufferKey = `${VIEW_REDIS_KEYS.CHAPTER_BUFFER}${chapterId}`;
      const bufferedCount = parseInt(await redis.get(bufferKey) || '0', 10);
      
      return { success: true, isFirstView: false, bufferedCount };
    }

    logger.debug(`[Redis] First view confirmed for chapter ${chapterId}, proceeding to track`);

    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();

    // Note: Deduplication key already set with SETNX above
    // Just increment the buffer and invalidate cache
    const bufferKey = `${VIEW_REDIS_KEYS.CHAPTER_BUFFER}${chapterId}`;
    pipeline.incr(bufferKey);

    // Invalidate cached view count
    const countCacheKey = `${VIEW_REDIS_KEYS.CHAPTER_COUNT_CACHE}${chapterId}`;
    pipeline.del(countCacheKey);

    // Execute pipeline
    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    // Get the incremented count from the INCR result (now at index 0)
    const bufferedCount = results[0][1] as number;

    logger.info(`[Redis] Successfully tracked chapter view: ${chapterId}, buffered count: ${bufferedCount}, user: ${userId || 'anonymous'}`);
    logger.debug(`Tracked chapter view in Redis: ${chapterId}, buffered count: ${bufferedCount}`);

    return { success: true, isFirstView: true, bufferedCount };
  } catch (error) {
    logger.error('Failed to track chapter view in Redis:', error);
    return { success: false, isFirstView: false, bufferedCount: 0 };
  }
}

/**
 * Get the current view count for a story (DB count + buffered count)
 * @param storyId The ID of the story
 * @returns The total view count
 */
export async function getStoryViewCount(storyId: string): Promise<number> {
  const redis = getRedisClient();
  
  if (!redis || !VIEW_TRACKING_CONFIG.ENABLED) {
    // Fallback to database query
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { readCount: true },
    });
    return story?.readCount || 0;
  }

  try {
    // Check cache first
    const cacheKey = `${VIEW_REDIS_KEYS.STORY_COUNT_CACHE}${storyId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return parseInt(cached, 10);
    }

    // Get DB count
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { readCount: true },
    });
    const dbCount = story?.readCount || 0;

    // Get buffered count
    const bufferKey = `${VIEW_REDIS_KEYS.STORY_BUFFER}${storyId}`;
    const bufferedCount = parseInt(await redis.get(bufferKey) || '0', 10);

    // Total count
    const totalCount = dbCount + bufferedCount;

    // Cache the result
    await redis.setex(cacheKey, VIEW_TRACKING_CONFIG.COUNT_CACHE_TTL, totalCount.toString());

    return totalCount;
  } catch (error) {
    logger.error('Failed to get story view count from Redis:', error);
    
    // Fallback to database
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { readCount: true },
    });
    return story?.readCount || 0;
  }
}

/**
 * Get the current view count for a chapter (DB count + buffered count)
 * @param chapterId The ID of the chapter
 * @returns The total view count
 */
export async function getChapterViewCount(chapterId: string): Promise<number> {
  const redis = getRedisClient();
  
  if (!redis || !VIEW_TRACKING_CONFIG.ENABLED) {
    // Fallback to database query
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { readCount: true },
    });
    return chapter?.readCount || 0;
  }

  try {
    // Check cache first
    const cacheKey = `${VIEW_REDIS_KEYS.CHAPTER_COUNT_CACHE}${chapterId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return parseInt(cached, 10);
    }

    // Get DB count
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { readCount: true },
    });
    const dbCount = chapter?.readCount || 0;

    // Get buffered count
    const bufferKey = `${VIEW_REDIS_KEYS.CHAPTER_BUFFER}${chapterId}`;
    const bufferedCount = parseInt(await redis.get(bufferKey) || '0', 10);

    // Total count
    const totalCount = dbCount + bufferedCount;

    // Cache the result
    await redis.setex(cacheKey, VIEW_TRACKING_CONFIG.COUNT_CACHE_TTL, totalCount.toString());

    return totalCount;
  } catch (error) {
    logger.error('Failed to get chapter view count from Redis:', error);
    
    // Fallback to database
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { readCount: true },
    });
    return chapter?.readCount || 0;
  }
}

/**
 * Get all buffered story views that need to be synced
 * @returns Map of story ID to buffered view count
 */
export async function getBufferedStoryViews(): Promise<Map<string, number>> {
  const redis = getRedisClient();
  
  if (!redis) {
    logger.warn('[Redis] Redis client not available for getting buffered story views');
    return new Map();
  }

  logger.debug('[Redis] Fetching buffered story views from Redis');

  try {
    // Get all story buffer keys
    const pattern = `${VIEW_REDIS_KEYS.STORY_BUFFER}*`;
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return new Map();
    }

    // Get all values in a single pipeline
    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.get(key));
    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    // Build map
    const viewMap = new Map<string, number>();
    keys.forEach((key, index) => {
      const storyId = key.replace(VIEW_REDIS_KEYS.STORY_BUFFER, '');
      const count = parseInt(results[index][1] as string || '0', 10);
      if (count > 0) {
        viewMap.set(storyId, count);
      }
    });

    logger.info(`[Redis] Retrieved ${viewMap.size} buffered story views from Redis`);
    return viewMap;
  } catch (error) {
    logger.error('Failed to get buffered story views:', error);
    return new Map();
  }
}

/**
 * Get all buffered chapter views that need to be synced
 * @returns Map of chapter ID to buffered view count
 */
export async function getBufferedChapterViews(): Promise<Map<string, number>> {
  const redis = getRedisClient();
  
  if (!redis) {
    logger.warn('[Redis] Redis client not available for getting buffered chapter views');
    return new Map();
  }

  logger.debug('[Redis] Fetching buffered chapter views from Redis');

  try {
    // Get all chapter buffer keys
    const pattern = `${VIEW_REDIS_KEYS.CHAPTER_BUFFER}*`;
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return new Map();
    }

    // Get all values in a single pipeline
    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.get(key));
    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    // Build map
    const viewMap = new Map<string, number>();
    keys.forEach((key, index) => {
      const chapterId = key.replace(VIEW_REDIS_KEYS.CHAPTER_BUFFER, '');
      const count = parseInt(results[index][1] as string || '0', 10);
      if (count > 0) {
        viewMap.set(chapterId, count);
      }
    });

    logger.info(`[Redis] Retrieved ${viewMap.size} buffered chapter views from Redis`);
    return viewMap;
  } catch (error) {
    logger.error('Failed to get buffered chapter views:', error);
    return new Map();
  }
}

/**
 * Clear buffered views for a story after successful sync
 * @param storyId The ID of the story
 */
export async function clearStoryViewBuffer(storyId: string): Promise<void> {
  const redis = getRedisClient();
  
  if (!redis) {
    return;
  }

  try {
    const bufferKey = `${VIEW_REDIS_KEYS.STORY_BUFFER}${storyId}`;
    const lastSyncKey = `${VIEW_REDIS_KEYS.STORY_LAST_SYNC}${storyId}`;
    
    const pipeline = redis.pipeline();
    pipeline.del(bufferKey);
    pipeline.set(lastSyncKey, Date.now().toString());
    await pipeline.exec();
    
    logger.debug(`Cleared view buffer for story ${storyId}`);
  } catch (error) {
    logger.error(`Failed to clear view buffer for story ${storyId}:`, error);
  }
}

/**
 * Clear buffered views for a chapter after successful sync
 * @param chapterId The ID of the chapter
 */
export async function clearChapterViewBuffer(chapterId: string): Promise<void> {
  const redis = getRedisClient();
  
  if (!redis) {
    return;
  }

  try {
    const bufferKey = `${VIEW_REDIS_KEYS.CHAPTER_BUFFER}${chapterId}`;
    const lastSyncKey = `${VIEW_REDIS_KEYS.CHAPTER_LAST_SYNC}${chapterId}`;
    
    const pipeline = redis.pipeline();
    pipeline.del(bufferKey);
    pipeline.set(lastSyncKey, Date.now().toString());
    await pipeline.exec();
    
    logger.debug(`Cleared view buffer for chapter ${chapterId}`);
  } catch (error) {
    logger.error(`Failed to clear view buffer for chapter ${chapterId}:`, error);
  }
}
