import { prisma } from "@/lib/auth/db-adapter";
import { calculateStoryStatus } from "./story-helpers";
import { Chapter } from "@/types/story";
import { logError } from "./error-logger";
// Temporarily commented out for performance improvement
// import { queueFollowerNotificationsAboutNewChapter } from "./chapter-notification-service";

/**
 * Process scheduled chapters that are due for publishing
 *
 * This function:
 * 1. Finds all chapters with status='scheduled' and publishDate in the past
 * 2. Updates their status to 'published'
 * 3. Updates the story status if needed
 *
 * @returns Object with counts of processed chapters and updated stories
 */
export async function processScheduledChapters() {
  const now = new Date();
  let publishedChaptersCount = 0;
  let updatedStoriesCount = 0;
  const updatedStoryIds = new Set<string>();

  try {
    // Find all scheduled chapters that should be published
    const scheduledChapters = await prisma.chapter.findMany({
      where: {
        status: 'scheduled',
        publishDate: {
          lte: now, // Less than or equal to current time
        },
      },
    });

    // Process each chapter
    for (const chapter of scheduledChapters) {
      try {
        // Update the chapter status to published
        await prisma.chapter.update({
          where: { id: chapter.id },
          data: {
            status: 'published'
          },
        });

        publishedChaptersCount++;

        // Add the story ID to the set of updated stories
        if (!updatedStoryIds.has(chapter.storyId)) {
          updatedStoryIds.add(chapter.storyId);
        }

        // Temporarily commented out since we're not sending notifications
        /*
        // Get the story to find the author ID
        const story = await prisma.story.findUnique({
          where: { id: chapter.storyId },
          select: { authorId: true }
        });
        */

        // Temporarily commented out to improve performance
        /*
        if (story) {
          // Queue notifications to followers (async operation)
          // Default to true for notifyFollowers since we can't know the author's preference
          await queueFollowerNotificationsAboutNewChapter(
            chapter.storyId,
            chapter.id,
            story.authorId,
            true
          );
        }
        */
      } catch (error) {
        logError(error, { context: 'Publishing scheduled chapter', chapterId: chapter.id })
      }
    }

    // Update story statuses for all affected stories
    for (const storyId of updatedStoryIds) {
      try {
        // Get the story
        const story = await prisma.story.findUnique({
          where: { id: storyId },
        });

        if (!story) {
          logError(`Story with ID ${storyId} not found`, { context: 'Updating story status' })
          continue;
        }

        // Get all chapters for this story
        const chapters = await prisma.chapter.findMany({
          where: { storyId },
          select: {
            status: true,
          },
        });

        // Calculate the new story status
        const isMarkedCompleted = story.status === "completed";
        const newStatus = calculateStoryStatus(chapters as Chapter[], isMarkedCompleted);

        // Update the story status if it's different
        if (newStatus !== story.status) {
          await prisma.story.update({
            where: { id: storyId },
            data: { status: newStatus },
          });
          updatedStoriesCount++;
        }
      } catch (error) {
        logError(error, { context: 'Updating story status', storyId })
      }
    }

    return {
      publishedChapters: publishedChaptersCount,
      updatedStories: updatedStoriesCount,
    };
  } catch (error) {
    logError(error, { context: 'Processing scheduled chapters' })
    throw error;
  }
}
