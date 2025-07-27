import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // remove punctuation
    .replace(/\s+/g, '-')      // replace spaces with -
    .replace(/-+/g, '-');      // collapse multiple dashes
}

async function main() {
  const genres = await prisma.genre.findMany();

  for (const genre of genres) {
    const baseSlug = slugify(genre.name);
    let slug = baseSlug;
    let suffix = 1;

    // Ensure uniqueness
    while (await prisma.genre.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    await prisma.genre.update({
      where: { id: genre.id },
      data: { slug },
    });

    console.log(`Updated genre "${genre.name}" with slug: ${slug}`);
  }
}

main()
  .then(() => {
    console.log('Slug backfill complete.');
    return prisma.$disconnect();
  })
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect();
  });
