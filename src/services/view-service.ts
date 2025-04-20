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
          const existingView = await tx.storyView.findUnique({
            where: {
              StoryView_userId_storyId_key: {
                userId,
                storyId,
              },
            },
          });

          isFirstView = !existingView;

          // Upsert the view with isFirstView flag
          view = await tx.storyView.upsert({
            where: {
              StoryView_userId_storyId_key: {
                userId,
                storyId,
              },
            },
            create: {
              storyId,
              userId,
              clientIp: clientInfo?.ip || null,
              userAgent: clientInfo?.userAgent || null,
              isFirstView: true, // Mark as first view for new records
            },
            update: {
              // Update timestamp but don't change isFirstView status
              createdAt: new Date(),
            },
          });

          // Only increment read count if this is a new view
          if (incrementReadCount && isFirstView) {
            await tx.story.update({
              where: { id: storyId },
              data: { readCount: { increment: 1 } },
            });
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

      return { view, isFirstView };
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
          const existingView = await tx.chapterView.findUnique({
            where: {
              ChapterView_userId_chapterId_key: {
                userId,
                chapterId,
              },
            },
          });

          isFirstView = !existingView;

          // Upsert the view with isFirstView flag
          view = await tx.chapterView.upsert({
            where: {
              ChapterView_userId_chapterId_key: {
                userId,
                chapterId,
              },
            },
            create: {
              chapterId,
              userId,
              clientIp: clientInfo?.ip || null,
              userAgent: clientInfo?.userAgent || null,
              isFirstView: true, // Mark as first view for new records
            },
            update: {
              // Update timestamp but don't change isFirstView status
              createdAt: new Date(),
            },
          });

          // Only increment read count if this is a new view
          if (isFirstView) {
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

      return { view, isFirstView, storyViewResult };
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

      // Group by storyId and count views
      const viewCounts = await prisma.storyView.groupBy({
        by: ['storyId'],
        where: whereClause,
        _count: true,
      });

      // Create a map of story ID to view count
      const viewCountMap = new Map<string, number>();

      // Initialize all requested story IDs with 0 views
      storyIds.forEach(id => viewCountMap.set(id, 0));

      // Update with actual counts
      viewCounts.forEach(item => {
        viewCountMap.set(item.storyId, item._count);
      });

      return viewCountMap;
    } catch (error) {
      console.error("Error getting batch story view counts:", error);
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

      // Group by chapterId and count views
      const viewCounts = await prisma.chapterView.groupBy({
        by: ['chapterId'],
        where: whereClause,
        _count: true,
      });

      // Create a map of chapter ID to view count
      const viewCountMap = new Map<string, number>();

      // Initialize all requested chapter IDs with 0 views
      chapterIds.forEach(id => viewCountMap.set(id, 0));

      // Update with actual counts
      viewCounts.forEach(item => {
        viewCountMap.set(item.chapterId, item._count);
      });

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
      const whereClause: any = {};

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

      // Group by storyId and count views
      const viewCounts = await prisma.storyView.groupBy({
        by: ['storyId'],
        where: whereClause,
        _count: true,
        orderBy: {
          _count: 'desc',
        },
        take: limit,
      });

      // Extract story IDs
      return viewCounts.map(item => item.storyId);
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
