import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting isOriginal update script...\n');

  // Get all stories with their genre information (excluding drafts)
  const stories = await prisma.story.findMany({
    where: {
      status: {
        not: 'draft',
      },
    },
    include: {
      genre: true,
    },
  });

  console.log(`Found ${stories.length} stories to process.\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let noGenreCount = 0;

  for (const story of stories) {
    // If story has no genre, skip it
    if (!story.genre) {
      noGenreCount++;
      console.log(`⚠️  Story "${story.title}" (${story.id}) has no genre - skipping`);
      continue;
    }

    // Determine if the story should be original
    // isOriginal = true if genre is NOT "Fanfiction" (case-insensitive)
    const isFanfiction = story.genre.name.toLowerCase() === 'fanfiction';
    const shouldBeOriginal = !isFanfiction;

    // Check if update is needed
    if (story.isOriginal === shouldBeOriginal) {
      skippedCount++;
      console.log(`✓ Story "${story.title}" already has correct isOriginal value (${shouldBeOriginal})`);
      continue;
    }

    // Update the story without changing updatedAt
    // Using raw SQL to bypass Prisma's automatic updatedAt update
    await prisma.$executeRaw`
      UPDATE "Story" 
      SET "isOriginal" = ${shouldBeOriginal}
      WHERE "id" = ${story.id}
    `;

    updatedCount++;
    console.log(
      `✅ Updated story "${story.title}" (Genre: ${story.genre.name}) - isOriginal: ${story.isOriginal} → ${shouldBeOriginal}`
    );
  }

  console.log('\n' + '='.repeat(60));
  console.log('Update Summary:');
  console.log('='.repeat(60));
  console.log(`Total stories processed: ${stories.length}`);
  console.log(`✅ Updated: ${updatedCount}`);
  console.log(`✓ Already correct: ${skippedCount}`);
  console.log(`⚠️  No genre (skipped): ${noGenreCount}`);
  console.log('='.repeat(60));
}

main()
  .then(() => {
    console.log('\n✨ isOriginal update complete!');
    return prisma.$disconnect();
  })
  .catch((err) => {
    console.error('\n❌ Error during update:', err);
    return prisma.$disconnect();
  });
