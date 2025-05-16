import { PrismaClient } from '@prisma/client'

// Note: The following imports are commented out since the middleware
// that would use them is currently disabled
// import { logger } from './logger'
// import { calculateStoryStatus } from './story-helpers'
// const prismaLogger = logger.child('prisma')

// Define global type for Prisma singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Create a new Prisma client instance
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // Add a simple middleware that just passes through operations
  // The commented-out chapter-specific logic can be re-enabled when needed
  client.$use(async (params, next) => {
    // Execute the operation
    const result = await next(params)

    // The following code is commented out but kept for future reference
    // It would update story status when chapters are modified
    /*
    if (params.model === 'Chapter') {
      if (['create', 'update', 'delete'].includes(params.action)) {
        try {
          let storyId: string | undefined;
          if (params.action === 'create' || params.action === 'update') {
            storyId = (result as any)?.storyId ?? params.args.data?.storyId;
          } else if (params.action === 'delete') {
            storyId = (result as any)?.storyId;
          }
          if (storyId) {
            const story = await client.story.findUnique({
              where: { id: storyId },
            });
            if (story) {
              const chapters = await client.chapter.findMany({
                where: { storyId },
                select: { status: true },
              });
              const isMarkedCompleted = story.status === 'completed';
              const newStatus = calculateStoryStatus(chapters as any, isMarkedCompleted);
              if (newStatus !== story.status) {
                await client.story.update({
                  where: { id: storyId },
                  data: { status: newStatus },
                });
              }
            } else {
              prismaLogger.warn(`Story with ID ${storyId} not found after chapter operation.`);
            }
          }
        } catch (error) {
          prismaLogger.error('Error updating story status:', { error });
        }
      }
    }
    */

    // Return the result
    return result
  })

  return client
}

export const prisma = globalForPrisma.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma