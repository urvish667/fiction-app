#!/usr/bin/env node

/**
 * Update image URLs from /api/images/ to /api/v1/images/ in database
 * This script migrates existing image URLs to match the new API versioning structure
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateImageUrls() {
  console.log('Starting image URL migration: /api/images/ → /api/v1/images/');

  let totalUpdated = 0;

  try {

    // Update Story cover images
    console.log('\nUpdating Story cover images...');
    const stories = await prisma.story.findMany({
      where: {
        coverImage: {
          startsWith: '/api/images/'
        }
      },
      select: { id: true, coverImage: true }
    });

    console.log(`Found ${stories.length} stories with image URLs to update`);

    for (let i = 0; i < stories.length; i += batchSize) {
      const batch = stories.slice(i, i + batchSize);
      await Promise.all(
        batch.map(story =>
          prisma.story.update({
            where: { id: story.id },
            data: {
              coverImage: story.coverImage.replace('/api/images/', '/api/v1/images/')
            }
          })
        )
      );
    }
    totalUpdated += stories.length;
    console.log(`Updated ${stories.length} story cover images`);

    // Update User profile images
    console.log('\nUpdating User profile images...');
    const userImages = await prisma.user.findMany({
      where: {
        image: {
          startsWith: '/api/images/'
        }
      },
      select: { id: true, image: true }
    });

    console.log(`Found ${userImages.length} users with profile image URLs to update`);

    for (let i = 0; i < userImages.length; i += batchSize) {
      const batch = userImages.slice(i, i + batchSize);
      await Promise.all(
        batch.map(user =>
          prisma.user.update({
            where: { id: user.id },
            data: {
              image: user.image.replace('/api/images/', '/api/v1/images/')
            }
          })
        )
      );
    }
    totalUpdated += userImages.length;
    console.log(`Updated ${userImages.length} user profile images`);

    // Update User banner images
    console.log('\nUpdating User banner images...');
    const userBanners = await prisma.user.findMany({
      where: {
        bannerImage: {
          startsWith: '/api/images/'
        }
      },
      select: { id: true, bannerImage: true }
    });

    console.log(`Found ${userBanners.length} users with banner image URLs to update`);

    for (let i = 0; i < userBanners.length; i += batchSize) {
      const batch = userBanners.slice(i, i + batchSize);
      await Promise.all(
        batch.map(user =>
          prisma.user.update({
            where: { id: user.id },
            data: {
              bannerImage: user.bannerImage.replace('/api/images/', '/api/v1/images/')
            }
          })
        )
      );
    }
    totalUpdated += userBanners.length;
    console.log(`Updated ${userBanners.length} user banner images`);

    // Update Blog images
    console.log('\nUpdating Blog images...');
    const blogs = await prisma.blog.findMany({
      where: {
        imageUrl: {
          startsWith: '/api/images/'
        }
      },
      select: { id: true, imageUrl: true }
    });

    console.log(`Found ${blogs.length} blogs with image URLs to update`);

    for (let i = 0; i < blogs.length; i += batchSize) {
      const batch = blogs.slice(i, i + batchSize);
      await Promise.all(
        batch.map(blog =>
          prisma.blog.update({
            where: { id: blog.id },
            data: {
              imageUrl: blog.imageUrl.replace('/api/images/', '/api/v1/images/')
            }
          })
        )
      );
    }
    totalUpdated += blogs.length;
    console.log(`Updated ${blogs.length} blog images`);

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`Total records updated: ${totalUpdated}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process signals for graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, closing database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, closing database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the migration
updateImageUrls().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
