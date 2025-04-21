import { prisma } from "@/lib/auth/db-adapter";

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
              await tx.story.update({
                where: { id: storyId },
                data: { readCount: { increment: 1 } },
              });
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
              await tx.story.update({
                where: { id: storyId },
                data: { readCount: { increment: 1 } },
              });
            }
          }
        }
      });

      // Get the updated view count after tracking the view
      const updatedViewCount = await this.getCombinedViewCount(storyId);

      return { view, isFirstView, viewCount: updatedViewCount };
    } catch (error) {
      console.error("Error tracking story view:", error);
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
            await tx.chapter.update({
              where: { id: chapterId },
              data: { readCount: { increment: 1 } },
            });
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
            await tx.chapter.update({
              where: { id: chapterId },
              data: { readCount: { increment: 1 } },
            });
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
          console.error("Error tracking story view after chapter view:", storyViewError);
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
      console.error("Error tracking chapter view:", error);
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
      console.error("Error getting story view count:", error);
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
      console.error("Error getting combined view count:", error);
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
      console.error("Error getting chapter view count:", error);
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

      // Use a simpler approach with count
      const viewCountMap = new Map<string, number>();

      // Initialize all requested story IDs with 0 views
      storyIds.forEach(id => viewCountMap.set(id, 0));

      // For each story ID, get the count directly
      for (const storyId of storyIds) {
        const count = await prisma.storyView.count({
          where: {
            ...whereClause,
            storyId
          }
        });
        viewCountMap.set(storyId, count);
      }

      return viewCountMap;
    } catch (error) {
      console.error("Error getting batch story view counts:", error);
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
      // Get story view counts
      const storyViewCountMap = await this.getBatchStoryViewCounts(storyIds, timeRange, startDate, endDate);

      // Create a map for the combined counts, starting with story views
      const combinedViewCountMap = new Map<string, number>(storyViewCountMap);

      // Get all chapters for these stories
      const chapters = await prisma.chapter.findMany({
        where: { storyId: { in: storyIds } },
        select: { id: true, storyId: true }
      });

      // Group chapters by story ID
      const chaptersByStory = chapters.reduce((acc, chapter) => {
        if (!acc[chapter.storyId]) {
          acc[chapter.storyId] = [];
        }
        acc[chapter.storyId].push(chapter.id);
        return acc;
      }, {} as Record<string, string[]>);

      // For each story with chapters, get chapter view counts
      for (const storyId of Object.keys(chaptersByStory)) {
        const chapterIds = chaptersByStory[storyId];

        if (chapterIds.length > 0) {
          // Get chapter view counts
          const chapterViewCountMap = await this.getBatchChapterViewCounts(chapterIds, timeRange, startDate, endDate);

          // Sum up all chapter views for this story
          const totalChapterViews = Array.from(chapterViewCountMap.values()).reduce((sum, count) => sum + count, 0);

          // Add chapter views to story views
          const currentStoryViews = combinedViewCountMap.get(storyId) || 0;
          combinedViewCountMap.set(storyId, currentStoryViews + totalChapterViews);
        }
      }

      return combinedViewCountMap;
    } catch (error) {
      console.error("Error getting batch combined view counts:", error);
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

      // Use a simpler approach with count
      const viewCountMap = new Map<string, number>();

      // Initialize all requested chapter IDs with 0 views
      chapterIds.forEach(id => viewCountMap.set(id, 0));

      // For each chapter ID, get the count directly
      for (const chapterId of chapterIds) {
        const count = await prisma.chapterView.count({
          where: {
            ...whereClause,
            chapterId
          }
        });
        viewCountMap.set(chapterId, count);
      }

      return viewCountMap;
    } catch (error) {
      console.error("Error getting batch chapter view counts:", error);
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
      // Simple approach: Get all published stories
      const stories = await prisma.story.findMany({
        where: { status: "published" },
        select: { id: true },
      });

      if (stories.length === 0) {
        return [];
      }

      // Get the story IDs
      const storyIds = stories.map(story => story.id);

      // Get view counts for all stories
      const viewCountMap = await this.getBatchCombinedViewCounts(
        storyIds,
        timeRange,
        startDate,
        endDate
      );

      // Convert to array, sort by count, and take top N
      const sortedStories = Array.from(viewCountMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(entry => entry[0]);

      return sortedStories;
    } catch (error) {
      console.error("Error getting most viewed stories:", error);
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
