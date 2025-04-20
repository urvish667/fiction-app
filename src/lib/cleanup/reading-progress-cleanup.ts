/**
 * Cleanup job for reading progress records
 * 
 * This module provides functions to clean up old reading progress records
 * to improve database performance.
 */

import { prisma } from "@/lib/auth/db-adapter";

/**
 * Clean up old reading progress records
 * 
 * This function removes reading progress records that are older than the specified
 * number of days and have a progress of 100% (completed).
 * 
 * @param daysToKeep Number of days to keep records (default: 90)
 * @returns Number of records deleted
 */
export async function cleanupCompletedReadingProgress(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  // Delete completed reading progress records older than the cutoff date
  const result = await prisma.readingProgress.deleteMany({
    where: {
      lastRead: {
        lt: cutoffDate,
      },
      progress: 100, // Only delete completed records
    },
  });
  
  return result.count;
}

/**
 * Clean up duplicate reading progress records
 * 
 * This function removes duplicate reading progress records for the same user and chapter,
 * keeping only the most recent one.
 * 
 * @returns Number of records deleted
 */
export async function cleanupDuplicateReadingProgress(): Promise<number> {
  // This is a more complex operation that requires raw SQL
  // We'll use a transaction to ensure data integrity
  
  let deletedCount = 0;
  
  await prisma.$transaction(async (tx) => {
    // Find duplicate records
    const duplicates = await tx.$queryRaw`
      SELECT "userId", "chapterId", COUNT(*) as count
      FROM "ReadingProgress"
      GROUP BY "userId", "chapterId"
      HAVING COUNT(*) > 1
    `;
    
    // For each set of duplicates, keep only the most recent one
    for (const dup of duplicates as any[]) {
      const { userId, chapterId, count } = dup;
      
      // Find all records for this user and chapter
      const records = await tx.readingProgress.findMany({
        where: {
          userId,
          chapterId,
        },
        orderBy: {
          lastRead: 'desc',
        },
      });
      
      // Keep the first one (most recent) and delete the rest
      const toDelete = records.slice(1);
      
      if (toDelete.length > 0) {
        const ids = toDelete.map(r => r.id);
        
        const result = await tx.readingProgress.deleteMany({
          where: {
            id: {
              in: ids,
            },
          },
        });
        
        deletedCount += result.count;
      }
    }
  });
  
  return deletedCount;
}

/**
 * Limit the number of reading progress records per user
 * 
 * This function ensures that each user has at most the specified number of
 * reading progress records, keeping only the most recent ones.
 * 
 * @param maxRecordsPerUser Maximum number of records per user (default: 100)
 * @returns Number of records deleted
 */
export async function limitReadingProgressPerUser(maxRecordsPerUser: number = 100): Promise<number> {
  let deletedCount = 0;
  
  // Get all users with reading progress records
  const users = await prisma.user.findMany({
    select: {
      id: true,
      _count: {
        select: {
          readingProgresses: true,
        },
      },
    },
    where: {
      readingProgresses: {
        some: {},
      },
    },
  });
  
  // For each user with more than the maximum number of records
  for (const user of users) {
    if (user._count.readingProgresses > maxRecordsPerUser) {
      // Get all reading progress records for this user
      const records = await prisma.readingProgress.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          lastRead: 'desc',
        },
        skip: maxRecordsPerUser, // Skip the most recent ones
      });
      
      if (records.length > 0) {
        const ids = records.map(r => r.id);
        
        const result = await prisma.readingProgress.deleteMany({
          where: {
            id: {
              in: ids,
            },
          },
        });
        
        deletedCount += result.count;
      }
    }
  }
  
  return deletedCount;
}
