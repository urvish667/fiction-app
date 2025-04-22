const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define source and target database URLs
const SOURCE_DB_URL = "postgresql://postgres:root@18.142.239.93:5432/fablespace_db";
const TARGET_DB_URL = process.env.DATABASE_URL;

// Create Prisma clients for source and target databases
const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: SOURCE_DB_URL,
    },
  },
});

const targetPrisma = new PrismaClient({
  datasources: {
    db: {
      url: TARGET_DB_URL,
    },
  },
});

// Helper function to chunk array into smaller pieces
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Main migration function
async function migrateComments() {
  console.log('Starting comments migration...');
  console.log(`Source: ${SOURCE_DB_URL}`);
  console.log(`Target: ${TARGET_DB_URL}`);
  
  try {
    // Migrate Comments
    console.log('\nMigrating Comments...');
    const comments = await sourcePrisma.comment.findMany();
    console.log(`Found ${comments.length} comments`);
    
    // First migrate comments without parents
    const rootComments = comments.filter(c => !c.parentId);
    const childComments = comments.filter(c => c.parentId);
    
    console.log(`Migrating ${rootComments.length} root comments...`);
    // Process root comments sequentially to avoid race conditions
    for (const comment of rootComments) {
      try {
        // Check if the story exists in the target database
        const storyExists = await targetPrisma.story.findUnique({
          where: { id: comment.storyId },
        });
        
        if (!storyExists) {
          console.log(`Skipping comment ${comment.id} because story ${comment.storyId} does not exist in target database`);
          continue;
        }
        
        // Check if the user exists in the target database
        const userExists = await targetPrisma.user.findUnique({
          where: { id: comment.userId },
        });
        
        if (!userExists) {
          console.log(`Skipping comment ${comment.id} because user ${comment.userId} does not exist in target database`);
          continue;
        }
        
        await targetPrisma.comment.upsert({
          where: { id: comment.id },
          update: comment,
          create: comment,
        });
        console.log(`Migrated root comment ${comment.id}`);
      } catch (error) {
        console.error(`Error migrating comment ${comment.id}:`, error.message);
      }
    }
    
    console.log(`Migrating ${childComments.length} child comments...`);
    // Sort child comments by their parent IDs to ensure parents are migrated before children
    const sortedChildComments = [...childComments].sort((a, b) => {
      // If a's parent is a root comment and b's isn't, a comes first
      const aParentIsRoot = rootComments.some(rc => rc.id === a.parentId);
      const bParentIsRoot = rootComments.some(rc => rc.id === b.parentId);
      
      if (aParentIsRoot && !bParentIsRoot) return -1;
      if (!aParentIsRoot && bParentIsRoot) return 1;
      
      // Otherwise, sort by parent ID
      return a.parentId.localeCompare(b.parentId);
    });
    
    // Process child comments sequentially to ensure proper parent-child relationships
    for (const comment of sortedChildComments) {
      try {
        // Check if the parent comment exists in the target database
        const parentExists = await targetPrisma.comment.findUnique({
          where: { id: comment.parentId },
        });
        
        if (!parentExists) {
          console.log(`Skipping comment ${comment.id} because parent comment ${comment.parentId} does not exist in target database`);
          continue;
        }
        
        // Check if the story exists in the target database
        const storyExists = await targetPrisma.story.findUnique({
          where: { id: comment.storyId },
        });
        
        if (!storyExists) {
          console.log(`Skipping comment ${comment.id} because story ${comment.storyId} does not exist in target database`);
          continue;
        }
        
        // Check if the user exists in the target database
        const userExists = await targetPrisma.user.findUnique({
          where: { id: comment.userId },
        });
        
        if (!userExists) {
          console.log(`Skipping comment ${comment.id} because user ${comment.userId} does not exist in target database`);
          continue;
        }
        
        await targetPrisma.comment.upsert({
          where: { id: comment.id },
          update: comment,
          create: comment,
        });
        console.log(`Migrated child comment ${comment.id}`);
      } catch (error) {
        console.error(`Error migrating comment ${comment.id}:`, error.message);
      }
    }
    
    // Migrate CommentLikes
    console.log('\nMigrating CommentLikes...');
    const commentLikes = await sourcePrisma.commentLike.findMany();
    console.log(`Found ${commentLikes.length} comment likes`);
    
    // Process comment likes sequentially to ensure related records exist
    for (const commentLike of commentLikes) {
      try {
        // Check if the comment exists in the target database
        const commentExists = await targetPrisma.comment.findUnique({
          where: { id: commentLike.commentId },
        });
        
        if (!commentExists) {
          console.log(`Skipping comment like ${commentLike.id} because comment ${commentLike.commentId} does not exist in target database`);
          continue;
        }
        
        // Check if the user exists in the target database
        const userExists = await targetPrisma.user.findUnique({
          where: { id: commentLike.userId },
        });
        
        if (!userExists) {
          console.log(`Skipping comment like ${commentLike.id} because user ${commentLike.userId} does not exist in target database`);
          continue;
        }
        
        await targetPrisma.commentLike.upsert({
          where: { id: commentLike.id },
          update: commentLike,
          create: commentLike,
        });
        console.log(`Migrated comment like ${commentLike.id}`);
      } catch (error) {
        console.error(`Error migrating comment like ${commentLike.id}:`, error.message);
      }
    }
    
    console.log('\nComments migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Disconnect from both databases
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// Run the migration
migrateComments().catch(console.error);
