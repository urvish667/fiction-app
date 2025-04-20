/**
 * Scheduled task to clean up reading progress records
 * 
 * This script is meant to be run as a scheduled task (e.g., via cron)
 * to clean up old and duplicate reading progress records.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting reading progress cleanup...');
  
  try {
    // Delete completed reading progress records older than 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const completedResult = await prisma.readingProgress.deleteMany({
      where: {
        lastRead: {
          lt: cutoffDate,
        },
        progress: 100, // Only delete completed records
      },
    });
    
    console.log(`Deleted ${completedResult.count} completed reading progress records older than 90 days`);
    
    // Limit the number of reading progress records per user
    const maxRecordsPerUser = 100;
    let totalLimitedCount = 0;
    
    // Get all users with more than the maximum number of reading progress records
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
    
    for (const user of users) {
      if (user._count.readingProgresses > maxRecordsPerUser) {
        // Get all reading progress records for this user beyond the limit
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
          
          totalLimitedCount += result.count;
        }
      }
    }
    
    console.log(`Limited reading progress records to ${maxRecordsPerUser} per user, deleted ${totalLimitedCount} records`);
    
    console.log('Reading progress cleanup completed successfully');
  } catch (error) {
    console.error('Error during reading progress cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
