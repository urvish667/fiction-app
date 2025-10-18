import { prisma } from "@/lib/auth/db-adapter";
import { logError } from "@/lib/error-logger";
import { logger } from "@/lib/logger";
import {
  trackStoryViewRedis,
  trackChapterViewRedis,
  getStoryViewCount as getRedisStoryViewCount,
  getChapterViewCount as getRedisChapterViewCount,
} from "@/lib/redis/view-tracking";

export class ViewService {
  /**
   * Track a story view for a user
   * @param storyId The ID of the story being viewed
   * @param userId The ID of the user viewing the story (optional for anonymous users)
   * @param clientInfo Additional client information for anonymous tracking
   * @param incrementReadCount Whether to increment the story's read count (default: true)
   * @returns The created view record or null if tracking failed
   */
  static async trackStoryView(
    storyId: string,
    userId?: string,
    clientInfo?: { ip?: string; userAgent?: string },
    incrementReadCount: boolean = true
  ) {
    // If no user ID and no client info, we can't track the view
    if (!userId && (!clientInfo?.ip && !clientInfo?.userAgent)) {
      return null;
    }

    try {
      // Try Redis-based view tracking first
      logger.info(`[ViewService] Attempting to track story view via Redis: ${storyId}, userId: ${userId || 'NOT PROVIDED'}, ip: ${clientInfo?.ip || 'NOT PROVIDED'}`);
      const redisResult = await trackStoryViewRedis(storyId, userId, clientInfo);
      
      if (redisResult.success) {
        logger.info(`[ViewService] Successfully tracked story view in Redis: ${storyId}, buffered: ${redisResult.bufferedCount}`);
        
        // Get the current view count from Redis (includes buffered views)
        const viewCount = await getRedisStoryViewCount(storyId);
        
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
      logger.warn(`[ViewService] Redis tracking failed for story ${storyId}, falling back to database with individual records (legacy mode)`);
      let view;
      let isFirstView = false;

      // Use a transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // For logged-in users, use upsert to atomically create or find the view
        if (userId) {
          // Check if this is the first view for this user and story
          const existingView = await tx.storyView.findFirst({
            where: {
              userId,
              storyId,
            },
          });

          isFirstView = !existingView;

          // Upsert the view with isFirstView flag
          if (existingView) {
            // Update existing view
            view = await tx.storyView.update({
              where: {
                id: existingView.id,
              },
              data: {
                createdAt: new Date(),
              },
            });
          } else {
            // Create new view
            view = await tx.storyView.create({
              data: {
                storyId,
                userId,
                clientIp: clientInfo?.ip || null,
                userAgent: clientInfo?.userAgent || null,
                isFirstView: true, // Mark as first view for new records
              },
            });

            // Only increment read count if this is a new view
            if (incrementReadCount) {
              // Use raw SQL query to increment readCount without updating the updatedAt field
              await tx.$executeRaw`UPDATE "Story" SET "readCount" = "readCount" + 1 WHERE id = ${storyId}`;
            }
          }

        } else {
          // For anonymous users, try to find an existing view with the same client info
          // within the last 24 hours to avoid counting the same anonymous user multiple times
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

          const existingView = await tx.storyView.findFirst({
            where: {
              storyId,
              userId: null,
              clientIp: clientInfo?.ip || null,
              userAgent: clientInfo?.userAgent || null,
              createdAt: { gte: oneDayAgo }
            },
            orderBy: { createdAt: 'desc' }
          });

          if (existingView) {
            // Use the existing view
            view = existingView;
            isFirstView = false;
          } else {
            // Create a new view
            view = await tx.storyView.create({
              data: {
                storyId,
                userId: null,
                clientIp: clientInfo?.ip || null,
                userAgent: clientInfo?.userAgent || null,
                isFirstView: true, // Mark as first view for new records
              },
            });

            isFirstView = true;

            // Only increment read count for new anonymous views
            if (incrementReadCount) {
              // Use raw SQL query to increment readCount without updating the updatedAt field
              await tx.$executeRaw`UPDATE "Story" SET "readCount" = "readCount" + 1 WHERE id = ${storyId}`;
            }
          }
        }
      });

      // Get the updated view count after tracking the view
      const updatedViewCount = await this.getCombinedViewCount(storyId);

      return { view, isFirstView, viewCount: updatedViewCount };
    } catch (error) {
      logError(error, { context: 'Tracking story view', storyId, userId })
      return null;
    }
  }

  /**
   * Track a chapter view for a user
   * @param chapterId The ID of the chapter being viewed
   * @param userId The ID of the user viewing the chapter (optional for anonymous users)
   * @param clientInfo Additional client information for anonymous tracking
   * @param trackStoryView Whether to also track a view for the story (default: false)
   * @returns The created view record or null if tracking failed
   */
  static async trackChapterView(
    chapterId: string,
    userId?: string,
    clientInfo?: { ip?: string; userAgent?: string },
    trackStoryView: boolean = false
  ) {
    // If no user ID and no client info, we can't track the view
    if (!userId && (!clientInfo?.ip && !clientInfo?.userAgent)) {
      return null;
    }

    try {
      // Try Redis-based view tracking first
      logger.info(`[ViewService] Attempting to track chapter view via Redis: ${chapterId}, userId: ${userId || 'NOT PROVIDED'}, ip: ${clientInfo?.ip || 'NOT PROVIDED'}`);
      const redisResult = await trackChapterViewRedis(chapterId, userId, clientInfo);
      
      if (redisResult.success) {
        logger.info(`[ViewService] Successfully tracked chapter view in Redis: ${chapterId}, buffered: ${redisResult.bufferedCount}`);
        
        // Get the chapter to find its story
        const chapter = await prisma.chapter.findUnique({
          where: { id: chapterId },
          select: { storyId: true },
        });
        
        if (!chapter) {
          throw new Error(`Chapter with ID ${chapterId} not found`);
        }
        
        // Get view counts from Redis
        const chapterViewCount = await getRedisChapterViewCount(chapterId);
        const storyViewCount = await getRedisStoryViewCount(chapter.storyId);
        
        // Track story view if requested
        let storyViewResult = null;
        if (trackStoryView) {
          try {
            storyViewResult = await this.trackStoryView(chapter.storyId, userId, clientInfo);
          } catch (storyViewError) {
            logError(storyViewError, { context: 'Tracking story view after chapter view', storyId: chapter.storyId, userId });
          }
        }
        
        // IMPORTANT: When Redis succeeds, we DO NOT create individual view records in DB
        // This prevents database flooding. Views are aggregated in Redis and synced to readCount periodically.
        return {
          view: null, // No individual DB record created
          isFirstView: redisResult.isFirstView,
          storyViewResult,
          chapterViewCount,
          storyViewCount,
        };
      }
      
      // FALLBACK ONLY: If Redis tracking failed completely, fall back to direct database tracking
      // This creates individual records (legacy behavior) only when Redis is unavailable
      logger.warn(`[ViewService] Redis tracking failed for chapter ${chapterId}, falling back to database with individual records (legacy mode)`);
      let view;
      let storyId: string | null = null;
      let isFirstView = false;

      // Use a transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // First, get the chapter to find its story
        const chapter = await tx.chapter.findUnique({
          where: { id: chapterId },
          select: { storyId: true },
        });

        if (!chapter) {
          throw new Error(`Chapter with ID ${chapterId} not found`);
        }

        storyId = chapter.storyId;

        // For logged-in users, use upsert to atomically create or find the view
        if (userId) {
          // Check if this is the first view for this user and chapter
          const existingView = await tx.chapterView.findFirst({
            where: {
              userId,
              chapterId,
            },
          });

          isFirstView = !existingView;

          // Upsert the view with isFirstView flag
          if (existingView) {
            // Update existing view
            view = await tx.chapterView.update({
              where: {
                id: existingView.id,
              },
              data: {
                createdAt: new Date(),
              },
            });
          } else {
            // Create new view
            view = await tx.chapterView.create({
              data: {
                chapterId,
                userId,
                clientIp: clientInfo?.ip || null,
                userAgent: clientInfo?.userAgent || null,
                isFirstView: true, // Mark as first view for new records
              },
            });

            // Only increment read count if this is a new view
            // Use raw SQL query to increment readCount without updating the updatedAt field
            await tx.$executeRaw`UPDATE "Chapter" SET "readCount" = "readCount" + 1 WHERE id = ${chapterId}`;
          }

        } else {
          // For anonymous users, try to find an existing view with the same client info
          // within the last 24 hours to avoid counting the same anonymous user multiple times
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

          const existingView = await tx.chapterView.findFirst({
            where: {
              chapterId,
              userId: null,
              clientIp: clientInfo?.ip || null,
              userAgent: clientInfo?.userAgent || null,
              createdAt: { gte: oneDayAgo }
            },
            orderBy: { createdAt: 'desc' }
          });

          if (existingView) {
            // Use the existing view
            view = existingView;
            isFirstView = false;
          } else {
            // Create a new view
            view = await tx.chapterView.create({
              data: {
                chapterId,
                userId: null,
                clientIp: clientInfo?.ip || null,
                userAgent: clientInfo?.userAgent || null,
                isFirstView: true, // Mark as first view for new records
              },
            });

            isFirstView = true;

            // Only increment read count for new anonymous views
            // Use raw SQL query to increment readCount without updating the updatedAt field
            await tx.$executeRaw`UPDATE "Chapter" SET "readCount" = "readCount" + 1 WHERE id = ${chapterId}`;
          }
        }
      });

      // Get the updated chapter view count
      const chapterViewCount = await this.getChapterViewCount(chapterId);

      // If requested and we have a story ID, track a story view as well
      // This is done outside the transaction to avoid nested transactions
      let storyViewResult = null;
      if (trackStoryView && storyId) {
        try {
          storyViewResult = await this.trackStoryView(storyId, userId, clientInfo);
        } catch (storyViewError) {
          logError(storyViewError, { context: 'Tracking story view after chapter view', storyId, userId })
          // Continue execution even if story view tracking fails
        }
      }

      // Get the combined view count for the story
      const storyViewCount = storyId ? await this.getCombinedViewCount(storyId) : 0;

      return {
        view,
        isFirstView,
        storyViewResult,
        chapterViewCount,
        storyViewCount
      };
    } catch (error) {
      logError(error, { context: 'Tracking chapter view', chapterId, userId })
      return null;
    }
  }

  /**
   * Get the total view count for a story
   * @param storyId The ID of the story
   * @param timeRange Optional time range for filtering views (e.g., '7days', '30days')
   * @returns The total view count
   */
  static async getStoryViewCount(storyId: string, timeRange?: string) {
    try {
      const whereClause: any = { storyId };

      // Add time range filter if provided
      if (timeRange) {
        const startDate = this.getStartDateFromTimeRange(timeRange);
        if (startDate) {
          whereClause.createdAt = { gte: startDate };
        }
      }

      const count = await prisma.storyView.count({
        where: whereClause,
      });
      return count;
    } catch (error) {
      logError(error, { context: 'Getting story view count', storyId })
      return 0;
    }
  }

  /**
   * Get the combined view count for a story (story views + chapter views)
   * @param storyId The ID of the story
   * @param timeRange Optional time range for filtering views (e.g., '7days', '30days')
   * @returns The combined view count (story views + chapter views)
   */
  static async getCombinedViewCount(storyId: string, timeRange?: string) {
    try {
      // Get story views
      const storyViews = await this.getStoryViewCount(storyId, timeRange);

      // Get chapter views for all chapters of this story
      let chapterViewsWhereClause: any = {};

      // Add time range filter if provided
      if (timeRange) {
        const startDate = this.getStartDateFromTimeRange(timeRange);
        if (startDate) {
          chapterViewsWhereClause.createdAt = { gte: startDate };
        }
      }

      // Find all chapters for this story
      const chapters = await prisma.chapter.findMany({
        where: { storyId },
        select: { id: true }
      });

      // Get chapter IDs
      const chapterIds = chapters.map(chapter => chapter.id);

      // If no chapters, return just story views
      if (chapterIds.length === 0) {
        return storyViews;
      }

      // Count chapter views
      const chapterViews = await prisma.chapterView.count({
        where: {
          ...chapterViewsWhereClause,
          chapterId: { in: chapterIds }
        }
      });

      // Return combined count
      return storyViews + chapterViews;
    } catch (error) {
      logError(error, { context: 'Getting combined view count', storyId })
      return 0;
    }
  }

  /**
   * Get the total view count for a chapter
   * @param chapterId The ID of the chapter
   * @param timeRange Optional time range for filtering views (e.g., '7days', '30days')
   * @returns The total view count
   */
  static async getChapterViewCount(chapterId: string, timeRange?: string) {
    try {
      const whereClause: any = { chapterId };

      // Add time range filter if provided
      if (timeRange) {
        const startDate = this.getStartDateFromTimeRange(timeRange);
        if (startDate) {
          whereClause.createdAt = { gte: startDate };
        }
      }

      const count = await prisma.chapterView.count({
        where: whereClause,
      });
      return count;
    } catch (error) {
      logError(error, { context: 'Getting chapter view count', chapterId })
      return 0;
    }
  }

  /**
   * Get multiple story view counts in a single batch operation
   * @param storyIds Array of story IDs
   * @param timeRange Optional time range for filtering views
   * @param startDate Optional custom start date (used when timeRange is 'custom')
   * @param endDate Optional custom end date (used when timeRange is 'custom')
   * @returns Map of story ID to view count
   */
  static async getBatchStoryViewCounts(
    storyIds: string[],
    timeRange?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Map<string, number>> {
    try {
      if (storyIds.length === 0) {
        return new Map();
      }

      const whereClause: any = {
        storyId: { in: storyIds },
      };

      // Add time range filter if provided
      if (timeRange === 'custom' && (startDate || endDate)) {
        // Use custom date range
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt.gte = startDate;
        }
        if (endDate) {
          whereClause.createdAt.lt = endDate;
        }
      } else if (timeRange) {
        // Use predefined time range
        const rangeStartDate = this.getStartDateFromTimeRange(timeRange);
        if (rangeStartDate) {
          whereClause.createdAt = { gte: rangeStartDate };
        }
      }

      // Use a more efficient approach with groupBy
      const viewCounts = await prisma.storyView.groupBy({
        by: ['storyId'],
        where: whereClause,
        _count: true,
      });

      // Create a map with all story IDs initialized to 0
      const viewCountMap = new Map<string, number>();
      storyIds.forEach(id => viewCountMap.set(id, 0));

      // Update the map with actual counts
      viewCounts.forEach(item => {
        viewCountMap.set(item.storyId, item._count);
      });

      return viewCountMap;
    } catch (error) {
      logError(error, { context: 'Getting batch story view counts', storyIds })
      // Return empty map with 0 counts for all requested stories
      return new Map(storyIds.map(id => [id, 0]));
    }
  }

  /**
   * Get combined view counts (story + chapter views) for multiple stories in a batch
   * @param storyIds Array of story IDs
   * @param timeRange Optional time range for filtering views
   * @param startDate Optional custom start date (used when timeRange is 'custom')
   * @param endDate Optional custom end date (used when timeRange is 'custom')
   * @returns Map of story ID to combined view count
   */
  static async getBatchCombinedViewCounts(
    storyIds: string[],
    timeRange?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Map<string, number>> {
    try {
      if (storyIds.length === 0) {
        return new Map();
      }

      // Create time range filter
      let createdAtFilter = {};
      if (timeRange === 'custom' && (startDate || endDate)) {
        // Use custom date range
        createdAtFilter = {};
        if (startDate) {
          createdAtFilter = { ...createdAtFilter, gte: startDate };
        }
        if (endDate) {
          createdAtFilter = { ...createdAtFilter, lt: endDate };
        }
      } else if (timeRange) {
        // Use predefined time range
        const rangeStartDate = this.getStartDateFromTimeRange(timeRange);
        if (rangeStartDate) {
          createdAtFilter = { gte: rangeStartDate };
        }
      }

      // Run both queries in parallel for better performance
      const [storyViewCounts, chapters] = await Promise.all([
        // Get story view counts
        prisma.storyView.groupBy({
          by: ['storyId'],
          where: {
            storyId: { in: storyIds },
            ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {})
          },
          _count: true,
        }),

        // Get all chapters for these stories
        prisma.chapter.findMany({
          where: { storyId: { in: storyIds } },
          select: { id: true, storyId: true }
        })
      ]);

      // Create a map with all story IDs initialized to 0
      const combinedViewCountMap = new Map<string, number>();
      storyIds.forEach(id => combinedViewCountMap.set(id, 0));

      // Add story view counts
      storyViewCounts.forEach(item => {
        combinedViewCountMap.set(item.storyId, item._count);
      });

      // If no chapters, return just story views
      if (chapters.length === 0) {
        return combinedViewCountMap;
      }

      // Get all chapter IDs
      const allChapterIds = chapters.map(chapter => chapter.id);

      // Get chapter view counts in a single query
      const chapterViewCounts = await prisma.chapterView.groupBy({
        by: ['chapterId'],
        where: {
          chapterId: { in: allChapterIds },
          ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {})
        },
        _count: true,
      });

      // Create a map of chapter ID to view count
      const chapterViewCountMap = new Map<string, number>();
      chapterViewCounts.forEach(item => {
        chapterViewCountMap.set(item.chapterId, item._count);
      });

      // Group chapters by story ID
      const chaptersByStory = chapters.reduce((acc, chapter) => {
        if (!acc[chapter.storyId]) {
          acc[chapter.storyId] = [];
        }
        acc[chapter.storyId].push(chapter.id);
        return acc;
      }, {} as Record<string, string[]>);

      // For each story with chapters, add chapter views to story views
      Object.entries(chaptersByStory).forEach(([storyId, chapterIds]) => {
        // Sum up all chapter views for this story
        const totalChapterViews = chapterIds.reduce((sum, chapterId) => {
          return sum + (chapterViewCountMap.get(chapterId) || 0);
        }, 0);

        // Add chapter views to story views
        const currentStoryViews = combinedViewCountMap.get(storyId) || 0;
        combinedViewCountMap.set(storyId, currentStoryViews + totalChapterViews);
      });

      return combinedViewCountMap;
    } catch (error) {
      logError(error, { context: 'Getting batch combined view counts', storyIds })
      // Return empty map with 0 counts for all requested stories
      return new Map(storyIds.map(id => [id, 0]));
    }
  }

  /**
   * Get multiple chapter view counts in a single batch operation
   * @param chapterIds Array of chapter IDs
   * @param timeRange Optional time range for filtering views
   * @param startDate Optional custom start date (used when timeRange is 'custom')
   * @param endDate Optional custom end date (used when timeRange is 'custom')
   * @returns Map of chapter ID to view count
   */
  static async getBatchChapterViewCounts(
    chapterIds: string[],
    timeRange?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Map<string, number>> {
    try {
      if (chapterIds.length === 0) {
        return new Map();
      }

      const whereClause: any = {
        chapterId: { in: chapterIds },
      };

      // Add time range filter if provided
      if (timeRange === 'custom' && (startDate || endDate)) {
        // Use custom date range
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt.gte = startDate;
        }
        if (endDate) {
          whereClause.createdAt.lt = endDate;
        }
      } else if (timeRange) {
        // Use predefined time range
        const rangeStartDate = this.getStartDateFromTimeRange(timeRange);
        if (rangeStartDate) {
          whereClause.createdAt = { gte: rangeStartDate };
        }
      }

      // Use a more efficient approach with groupBy
      const viewCounts = await prisma.chapterView.groupBy({
        by: ['chapterId'],
        where: whereClause,
        _count: true,
      });

      // Create a map with all chapter IDs initialized to 0
      const viewCountMap = new Map<string, number>();
      chapterIds.forEach(id => viewCountMap.set(id, 0));

      // Update the map with actual counts
      viewCounts.forEach(item => {
        viewCountMap.set(item.chapterId, item._count);
      });

      return viewCountMap;
    } catch (error) {
      logError(error, { context: 'Getting batch chapter view counts', chapterIds })
      // Return empty map with 0 counts for all requested chapters
      return new Map(chapterIds.map(id => [id, 0]));
    }
  }

  /**
   * Get most viewed stories
   * @param limit Number of stories to return
   * @param timeRange Optional time range for filtering views
   * @param startDate Optional custom start date (used when timeRange is 'custom')
   * @param endDate Optional custom end date (used when timeRange is 'custom')
   * @returns Array of story IDs sorted by view count
   */
  static async getMostViewedStories(
    limit: number = 10,
    timeRange?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string[]> {
    try {
      // Create time range filter
      let createdAtFilter = {};
      if (timeRange === 'custom' && (startDate || endDate)) {
        // Use custom date range
        createdAtFilter = {};
        if (startDate) {
          createdAtFilter = { ...createdAtFilter, gte: startDate };
        }
        if (endDate) {
          createdAtFilter = { ...createdAtFilter, lt: endDate };
        }
      } else if (timeRange) {
        // Use predefined time range
        const rangeStartDate = this.getStartDateFromTimeRange(timeRange);
        if (rangeStartDate) {
          createdAtFilter = { gte: rangeStartDate };
        }
      }

      // Get all published stories (non-draft) with their IDs
      const stories = await prisma.story.findMany({
        where: {
          status: { not: 'draft' } // Only include published stories
        },
        select: { id: true, status: true },
      });

      if (stories.length === 0) {
        return [];
      }

      const storyIds = stories.map(story => story.id);

      // Get story view counts
      const storyViewCounts = await prisma.storyView.groupBy({
        by: ['storyId'],
        where: {
          storyId: { in: storyIds },
          ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {})
        },
        _count: true,
      });

      // Get all chapters for these stories
      const chapters = await prisma.chapter.findMany({
        where: { storyId: { in: storyIds } },
        select: { id: true, storyId: true }
      });

      // If no chapters, just use story views
      if (chapters.length === 0) {
        // Create a map of story ID to view count
        const viewCountMap = new Map<string, number>();
        storyIds.forEach(id => viewCountMap.set(id, 0));

        // Add story view counts
        storyViewCounts.forEach(item => {
          viewCountMap.set(item.storyId, item._count);
        });

        // Sort and return top N
        return Array.from(viewCountMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(entry => entry[0]);
      }

      // Get all chapter IDs
      const allChapterIds = chapters.map(chapter => chapter.id);

      // Get chapter view counts
      const chapterViewCounts = await prisma.chapterView.groupBy({
        by: ['chapterId'],
        where: {
          chapterId: { in: allChapterIds },
          ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {})
        },
        _count: true,
      });

      // Create a map of chapter ID to view count
      const chapterViewCountMap = new Map<string, number>();
      chapterViewCounts.forEach(item => {
        chapterViewCountMap.set(item.chapterId, item._count);
      });

      // Group chapters by story ID
      const chaptersByStory = chapters.reduce((acc, chapter) => {
        if (!acc[chapter.storyId]) {
          acc[chapter.storyId] = [];
        }
        acc[chapter.storyId].push(chapter.id);
        return acc;
      }, {} as Record<string, string[]>);

      // Create a map for combined view counts
      const combinedViewCountMap = new Map<string, number>();
      storyIds.forEach(id => combinedViewCountMap.set(id, 0));

      // Add story view counts
      storyViewCounts.forEach(item => {
        combinedViewCountMap.set(item.storyId, item._count);
      });

      // Add chapter view counts
      Object.entries(chaptersByStory).forEach(([storyId, chapterIds]) => {
        const totalChapterViews = chapterIds.reduce((sum, chapterId) => {
          return sum + (chapterViewCountMap.get(chapterId) || 0);
        }, 0);

        const currentStoryViews = combinedViewCountMap.get(storyId) || 0;
        combinedViewCountMap.set(storyId, currentStoryViews + totalChapterViews);
      });

      // Sort by view count and take top N
      const sortedStories = Array.from(combinedViewCountMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(entry => entry[0]);

      return sortedStories;
    } catch (error) {
      logError(error, { context: 'Getting most viewed stories' })
      return [];
    }
  }

  /**
   * Helper method to convert a time range string to a Date object
   * @param timeRange Time range string (e.g., '7days', '30days', '90days', 'year', 'all')
   * @returns Date object representing the start date for the time range
   */
  private static getStartDateFromTimeRange(timeRange: string): Date | null {
    const now = new Date();

    switch (timeRange) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'all':
        return null; // No date filter for 'all'
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
    }
  }
}
