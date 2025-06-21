import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
//   await prisma.$executeRawUnsafe(`
//     DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20250611112532_add_blog_table';
//   `)
  await prisma.$executeRawUnsafe(`
    DROP TABLE "Blog";
  `)
//  console.log('Deleted migration record successfully')
    console.log('Deleted Blog table successfully')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
