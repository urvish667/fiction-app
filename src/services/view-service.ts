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

      // Use a transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // For logged-in users, use upsert to atomically create or find the view
        if (userId) {
          view = await tx.storyView.upsert({
            where: {
              // Use the actual constraint name from the database
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
            },
            update: {}, // No updates needed if it already exists
          });

          // Get the previous view count to determine if this is a new view
          const previousView = await tx.storyView.findFirst({
            where: {
              userId,
              storyId,
            },
            select: {
              id: true,
              createdAt: true
            }
          });

          // Only increment read count if this is a new view (no previous view found)
          if (incrementReadCount && view && (!previousView || previousView.id === view.id)) {
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
          } else {
            // Create a new view
            view = await tx.storyView.create({
              data: {
                storyId,
                userId: null,
                clientIp: clientInfo?.ip || null,
                userAgent: clientInfo?.userAgent || null,
              },
            });

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

      return view;
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
          view = await tx.chapterView.upsert({
            where: {
              // Use the actual constraint name from the database
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
            },
            update: {}, // No updates needed if it already exists
          });

          // Get the previous view count to determine if this is a new view
          const previousView = await tx.chapterView.findFirst({
            where: {
              userId,
              chapterId,
            },
            select: {
              id: true,
              createdAt: true
            }
          });

          // Only increment read count if this is a new view (no previous view found)
          if (view && (!previousView || previousView.id === view.id)) {
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
          } else {
            // Create a new view
            view = await tx.chapterView.create({
              data: {
                chapterId,
                userId: null,
                clientIp: clientInfo?.ip || null,
                userAgent: clientInfo?.userAgent || null,
              },
            });

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
      if (trackStoryView && storyId) {
        try {
          await this.trackStoryView(storyId, userId, clientInfo);
        } catch (storyViewError) {
          console.error("Error tracking story view after chapter view:", storyViewError);
          // Continue execution even if story view tracking fails
        }
      }

      return view;
    } catch (error) {
      console.error("Error tracking chapter view:", error);
      return null;
    }
  }

  /**
   * Get the total view count for a story
   * @param storyId The ID of the story
   * @returns The total view count
   */
  static async getStoryViewCount(storyId: string) {
    try {
      const count = await prisma.storyView.count({
        where: { storyId },
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
   * @returns The total view count
   */
  static async getChapterViewCount(chapterId: string) {
    try {
      const count = await prisma.chapterView.count({
        where: { chapterId },
      });
      return count;
    } catch (error) {
      console.error("Error getting chapter view count:", error);
      return 0;
    }
  }
}
