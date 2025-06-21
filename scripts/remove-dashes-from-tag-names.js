// scripts/remove-dashes-from-tag-names.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


async function main() {
  // 1. Fetch all tags whose name contains a dash
  const tags = await prisma.tag.findMany({
    where: { name: { contains: '-', mode: 'insensitive' } },
    select: { id: true, name: true },
  });

  console.log(`Found ${tags.length} tag(s) with dashes in the name`);

  for (const { id, name } of tags) {
    const newName = name.replace(/-/g, ' ');

    // Skip if removing dashes produces the exact same string
    if (newName === name) continue;

    try {
      // 2. Update each, catching any unique‐constraint errors
      await prisma.tag.update({
        where: { id },
        data: { name: newName },
      });
      console.log({ id, oldName: name, newName }, 'Tag name updated');
    } catch (err) {
      // Unique constraint violation or other error
      if (err.code === 'P2002' && err.meta?.target?.includes('name')) {
        console.warn(
          { id, oldName: name, attemptedNewName: newName },
          'Skipping update because another tag already has that name'
        );
      } else {
        console.error({ err, id, name }, 'Failed to update tag name');
      }
    }
  }
}

main()
  .then(() => {
    console.log('✅ Done removing dashes from tag names');
  })
  .catch((e) => {
    console.error(e, 'Script failed');
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
