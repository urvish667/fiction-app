/**
 * Service for processing scheduled chapters
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface ProcessingResult {
  publishedChapters: number;
  updatedStories: number;
}

export class ScheduledChaptersService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Calculate the status of a story based on its chapters
   */
  private calculateStoryStatus(chapters: { status: string }[], isMarkedCompleted = false): string {
    // If there are no chapters, the story is a draft
    if (!chapters || chapters.length === 0) {
      return "draft";
    }

    // Count published chapters (not draft or scheduled)
    const publishedChapters = chapters.filter(chapter =>
      chapter.status === 'published'
    );

    // If there are no published chapters, the story is a draft
    if (publishedChapters.length === 0) {
      return "draft";
    }

    // If the story is manually marked as completed and has at least one published chapter
    if (isMarkedCompleted && publishedChapters.length > 0) {
      return "completed";
    }

    // Otherwise, it's ongoing
    return "ongoing";
  }

  /**
   * Process scheduled chapters that are due for publishing
   */
  async processScheduledChapters(): Promise<ProcessingResult> {
    const now = new Date();
    let publishedChaptersCount = 0;
    let updatedStoriesCount = 0;
    const updatedStoryIds = new Set<string>();

    try {
      logger.info('Looking for scheduled chapters to publish...');

      // Find all scheduled chapters that should be published
      const scheduledChapters = await this.prisma.chapter.findMany({
        where: {
          status: 'scheduled',
          publishDate: {
            lte: now, // Less than or equal to current time
          },
        },
      });

      logger.info(`Found ${scheduledChapters.length} scheduled chapters to publish`);

      // Process each chapter
      for (const chapter of scheduledChapters) {
        try {
          // Update the chapter status to published
          await this.prisma.chapter.update({
            where: { id: chapter.id },
            data: {
              status: 'published'
            },
          });

          publishedChaptersCount++;
          logger.info(`Published chapter: "${chapter.title}" (ID: ${chapter.id})`);

          // Add the story ID to the set of updated stories
          if (!updatedStoryIds.has(chapter.storyId)) {
            updatedStoryIds.add(chapter.storyId);
          }
        } catch (error) {
          logger.error(`Error publishing chapter ${chapter.id}`, { error });
        }
      }

      // Update story statuses for all affected stories
      logger.info(`Updating status for ${updatedStoryIds.size} stories...`);

      for (const storyId of updatedStoryIds) {
        try {
          // Get the story and all its chapters
          const story = await this.prisma.story.findUnique({
            where: { id: storyId },
          });

          if (!story) {
            logger.error(`Story with ID ${storyId} not found`);
            continue;
          }

          // Get all chapters for this story
          const chapters = await this.prisma.chapter.findMany({
            where: { storyId },
            select: {
              status: true,
            },
          });

          // Calculate the new story status
          const isMarkedCompleted = story.status === "completed";
          const newStatus = this.calculateStoryStatus(chapters, isMarkedCompleted);

          // Update the story status if it's different
          if (newStatus !== story.status) {
            await this.prisma.story.update({
              where: { id: storyId },
              data: { status: newStatus },
            });
            updatedStoriesCount++;
            logger.info(`Updated story "${story.title}" status from "${story.status}" to "${newStatus}"`);
          }
        } catch (error) {
          logger.error(`Error updating story status for story ${storyId}`, { error });
        }
      }

      logger.info('Processing completed', {
        publishedChapters: publishedChaptersCount,
        updatedStories: updatedStoriesCount,
      });

      return {
        publishedChapters: publishedChaptersCount,
        updatedStories: updatedStoriesCount,
      };
    } catch (error) {
      logger.error("Error processing scheduled chapters", { error });
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.debug('Database connection closed');
    } catch (error) {
      logger.error('Error during cleanup', { error });
    }
  }
}
