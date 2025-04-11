/**
 * Script to manually process scheduled chapters
 *
 * This script can be run from the command line to process scheduled chapters
 * that are due for publishing.
 *
 * Usage:
 *   node scripts/process-scheduled-chapters.js
 */

// Set up environment variables from .env file
require('dotenv').config();

// Import the PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculate the status of a story based on its chapters
 */
function calculateStoryStatus(chapters, isMarkedCompleted = false) {
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
 * Process scheduled chapters
 */
async function processScheduledChapters() {
  const now = new Date();
  let publishedChaptersCount = 0;
  let updatedStoriesCount = 0;
  const updatedStoryIds = new Set();

  try {
    console.log('Looking for scheduled chapters to publish...');

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
        console.log(`Published chapter: "${chapter.title}" (ID: ${chapter.id})`);

        // Add the story ID to the set of updated stories
        if (!updatedStoryIds.has(chapter.storyId)) {
          updatedStoryIds.add(chapter.storyId);
        }
      } catch (error) {
        console.error(`Error publishing chapter ${chapter.id}:`, error);
      }
    }

    // Update story statuses for all affected stories
    console.log(`Updating status for ${updatedStoryIds.size} stories...`);

    for (const storyId of updatedStoryIds) {
      try {
        // Get the story and all its chapters
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
        const newStatus = calculateStoryStatus(chapters, isMarkedCompleted);

        // Update the story status if it's different
        if (newStatus !== story.status) {
          await prisma.story.update({
            where: { id: storyId },
            data: { status: newStatus },
          });
          updatedStoriesCount++;
          console.log(`Updated story "${story.title}" status from "${story.status}" to "${newStatus}"`);
        }
      } catch (error) {
        console.error(`Error updating story status for story ${storyId}:`, error);
      }
    }

    console.log('\nSummary:');
    console.log(`- Published chapters: ${publishedChaptersCount}`);
    console.log(`- Updated stories: ${updatedStoriesCount}`);

    return {
      publishedChapters: publishedChaptersCount,
      updatedStories: updatedStoriesCount,
    };
  } catch (error) {
    console.error("Error processing scheduled chapters:", error);
    throw error;
  } finally {
    // Disconnect from the database
    await prisma.$disconnect();
  }
}

// Run the function
processScheduledChapters()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
