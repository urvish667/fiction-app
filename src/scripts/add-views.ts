import { logError } from '@/lib/error-logger';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

async function addViewsToStories() {
  try {
    // Get all stories
    const stories = await prisma.story.findMany({
      select: {
        id: true,
        title: true,
      },
    });

    // Add views to each story
    for (const story of stories) {
      // Generate a random number of views between 5 and 50
      const viewCount = Math.floor(Math.random() * 46) + 5;
      
      // Create view records
      const viewPromises = [];
      for (let i = 0; i < viewCount; i++) {
        viewPromises.push(
          prisma.storyView.create({
            data: {
              storyId: story.id,
              clientIp: `192.168.1.${i % 255}`, // Generate different IPs
              userAgent: 'Mozilla/5.0 Test Script',
              isFirstView: true,
            },
          })
        );
      }
      
      await Promise.all(viewPromises);
      
      // Update the story's readCount
      await prisma.story.update({
        where: { id: story.id },
        data: { readCount: viewCount },
      });
    }

  } catch (error) {
    logError(error, { context: 'Adding views to stories' });
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addViewsToStories();
