import { prisma } from "@/lib/auth/db-adapter";
import { calculateStoryStatus } from "./story-helpers";
import { Chapter, Story } from "@/types/story";
import { PrismaClient } from "@prisma/client";

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

    console.log(`Found ${scheduledChapters.length} scheduled chapters to publish`);

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
      } catch (error) {
        console.error(`Error publishing chapter ${chapter.id}:`, error);
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
          console.error(`Story with ID ${storyId} not found`);
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
        console.error(`Error updating story status for story ${storyId}:`, error);
      }
    }

    return {
      publishedChapters: publishedChaptersCount,
      updatedStories: updatedStoriesCount,
    };
  } catch (error) {
    console.error("Error processing scheduled chapters:", error);
    throw error;
  }
}
