import { PrismaClient } from '@prisma/client'
import { calculateStoryStatus } from './story-helpers'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Create a new Prisma client instance
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // Add middleware
  client.$use(async (params, next) => {
    
    // *** Execute the actual operation FIRST ***
    const result = await next(params);

    /*
    // Temporarily comment out chapter-specific logic to isolate the error
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
               console.warn(`[Prisma Middleware] Story with ID ${storyId} not found after chapter operation.`);
            }
          }
        } catch (error) {
          console.error('[Prisma Middleware] Error updating story status:', error);
        }
      }
    } 
    */

    // *** Return the result of the original operation ***
    return result;
  })

  return client
}

export const prisma = globalForPrisma.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma