import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const tableNames = ['Donation', 'Payout'];
const prisma = new PrismaClient()

async function checkTableExists(tableName) {
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      );
    `;
    return result[0].exists;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

async function main() {
  for (const tableName of tableNames) {
    const exists = await checkTableExists(tableName);
    
    if (exists) {
      try {
        await prisma.$queryRawUnsafe(`TRUNCATE "${tableName}" RESTART IDENTITY CASCADE;`);
        console.log(`✅ Successfully truncated table: ${tableName}`);
      } catch (error) {
        console.error(`❌ Failed to truncate table ${tableName}:`, error.message);
      }
    } else {
      console.log(`⚠️  Table ${tableName} does not exist, skipping...`);
    }
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});