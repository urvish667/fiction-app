import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Production-level genre and language seeds
  const genres = [
    'Fantasy', 'Science Fiction', 'Mystery', 'Thriller', 'Romance', 'Horror',
    'Historical', 'Adventure', 'Young Adult', 'Drama', 'Comedy', 'Non-Fiction',
    'Memoir', 'Biography', 'Self-Help', 'Children', 'Crime', 'Poetry', 'LGBTQ+',
    'Short Story', 'Urban', 'Paranormal', 'Dystopian', 'Slice of Life', 'Fanfiction'
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Chinese', 'Japanese', 'Korean', 'Hindi', 'Arabic', 'Turkish', 'Vietnamese',
    'Indonesian', 'Bengali', 'Polish', 'Dutch', 'Swedish', 'Greek', 'Czech',
    'Thai', 'Hebrew', 'Romanian', 'Hungarian', 'Ukrainian'
  ];

  for (const name of genres) {
    await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of languages) {
    await prisma.language.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('✅ Genres and languages seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
