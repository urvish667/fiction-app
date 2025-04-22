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

// Tables to verify (excluding Genre and Tag)
const TABLES_TO_VERIFY = [
  'Account',
  'Session',
  'User',
  'VerificationToken',
  'PasswordResetToken',
  'Notification',
  'Story',
  'Chapter',
  'Comment',
  'Like',
  'Bookmark',
  'Follow',
  'Language',
  'Donation',
  'StoryView',
  'ChapterView',
  'ReadingProgress',
  'CommentLike',
  'StoryRecommendation'
];

// Main verification function
async function verifyMigration() {
  console.log('Verifying database migration...');
  console.log(`Source: ${SOURCE_DB_URL}`);
  console.log(`Target: ${TARGET_DB_URL}`);
  
  try {
    console.log('\nComparing record counts between source and target databases:');
    console.log('--------------------------------------------------------------');
    console.log('Table               | Source Count | Target Count | Status');
    console.log('--------------------------------------------------------------');
    
    for (const table of TABLES_TO_VERIFY) {
      try {
        // Get count from source database
        const sourceCount = await sourcePrisma[table.toLowerCase()].count();
        
        // Get count from target database
        const targetCount = await targetPrisma[table.toLowerCase()].count();
        
        // Calculate percentage migrated
        const percentage = sourceCount > 0 ? Math.round((targetCount / sourceCount) * 100) : 100;
        
        // Determine status
        let status = '✅ Complete';
        if (percentage < 100) {
          status = `⚠️ ${percentage}%`;
        }
        if (percentage === 0) {
          status = '❌ Not migrated';
        }
        
        // Format output
        const tableFormatted = table.padEnd(20);
        const sourceCountFormatted = String(sourceCount).padEnd(13);
        const targetCountFormatted = String(targetCount).padEnd(13);
        
        console.log(`${tableFormatted}| ${sourceCountFormatted}| ${targetCountFormatted}| ${status}`);
      } catch (error) {
        console.log(`${table.padEnd(20)}| Error: ${error.message}`);
      }
    }
    
    console.log('--------------------------------------------------------------');
    console.log('\nVerification completed!');
    
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    // Disconnect from both databases
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// Run the verification
verifyMigration().catch(console.error);
