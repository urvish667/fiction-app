const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define source and target database URLs
const SOURCE_DB_URL = "postgresql://postgres:root@18.142.239.93:5432/fablespace_db";
const TARGET_DB_URL = process.env.DATABASE_URL;

async function testConnections() {
  console.log('Testing database connections...');
  console.log(`Source: ${SOURCE_DB_URL}`);
  console.log(`Target: ${TARGET_DB_URL}`);
  
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

  try {
    // Test source connection
    console.log('\nTesting connection to source database...');
    const sourceUserCount = await sourcePrisma.user.count();
    console.log(`✅ Successfully connected to source database. Found ${sourceUserCount} users.`);
    
    // Test target connection
    console.log('\nTesting connection to target database...');
    const targetUserCount = await targetPrisma.user.count();
    console.log(`✅ Successfully connected to target database. Found ${targetUserCount} users.`);
    
    console.log('\nBoth database connections are working properly!');
  } catch (error) {
    console.error('Error testing database connections:', error);
  } finally {
    // Disconnect from both databases
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// Run the test
testConnections().catch(console.error);
