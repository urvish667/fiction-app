import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for duplicate slugs in Tag table...');

  const tags = await prisma.tag.findMany({
    where: {
      NOT: [
        { slug: null }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  const slugMap = new Map();
  const duplicates = [];

  for (const tag of tags) {
    const slug = tag.slug;

    if (slugMap.has(slug)) {
      duplicates.push({
        duplicateOf: slugMap.get(slug),
        duplicate: tag,
      });
    } else {
      slugMap.set(slug, tag);
    }
  }

  if (duplicates.length === 0) {
    console.log('✅ No duplicate slugs found.');
  } else {
    console.warn(`❌ Found ${duplicates.length} duplicate slug(s):`);
    for (const { duplicateOf, duplicate } of duplicates) {
      console.log(`- "${duplicate.slug}" used by:`);
      console.log(`    1. ID: ${duplicateOf.id}, Name: "${duplicateOf.name}"`);
      console.log(`    2. ID: ${duplicate.id}, Name: "${duplicate.name}"`);
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Error while checking duplicates:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
