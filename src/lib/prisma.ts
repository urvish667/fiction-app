import { PrismaClient } from '@prisma/client'
import { calculateStoryStatus } from './story-helpers'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Create a new Prisma client instance
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // Add middleware to update story status when chapters are modified
  client.$use(async (params, next) => {
    // Only run this middleware for Chapter model operations
    if (params.model === 'Chapter') {
      // Process the action
      const result = await next(params)

      // After a chapter is created, updated, or deleted, update the story status
      if (['create', 'update', 'delete'].includes(params.action)) {
        try {
          // Get the storyId
          let storyId: string | undefined

          if (params.action === 'create' || params.action === 'update') {
            // For create/update, get storyId from the data
            storyId = params.args.data?.storyId || (result?.storyId as string)
          } else if (params.action === 'delete') {
            // For delete, get storyId from the result
            storyId = result?.storyId as string
          }

          if (storyId) {
            // Get the story
            const story = await client.story.findUnique({
              where: { id: storyId },
            })

            if (!story) {
              console.error(`Story with ID ${storyId} not found`)
              return
            }

            // Get all chapters for this story
            const chapters = await client.chapter.findMany({
              where: { storyId },
              select: {
                status: true,
              },
            })

            // Check if the story is manually marked as completed
            const isMarkedCompleted = story.status === 'completed'

            // Calculate the new story status
            const newStatus = calculateStoryStatus(chapters as any, isMarkedCompleted)

            // Update the story status if it's different
            if (newStatus !== story.status) {
              await client.story.update({
                where: { id: storyId },
                data: { status: newStatus },
              })
            }
          }
        } catch (error) {
          console.error('Error in Prisma middleware updating story status:', error)
          // Don't throw the error to avoid breaking the original operation
        }
      }
    }

    return result
  })

  return client
}

export const prisma = globalForPrisma.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma