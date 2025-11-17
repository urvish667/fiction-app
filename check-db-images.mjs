#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImages() {
  try {
    console.log('Checking stories with cover images...\n');

    const stories = await prisma.story.findMany({
      where: { coverImage: { not: null } },
      select: { id: true, title: true, coverImage: true },
      take: 5
    });

    console.log(`Found ${stories.length} stories with cover images:`);
    stories.forEach(story => {
      console.log(`- "${story.title}": ${story.coverImage}`);
    });

    if (stories.length === 0) {
      console.log('No stories with cover images found.');
    }

    // Also check users with profile images
    console.log('\nChecking users with profile images...\n');

    const users = await prisma.user.findMany({
      where: { image: { not: null } },
      select: { id: true, name: true, username: true, image: true },
      take: 3
    });

    console.log(`Found ${users.length} users with profile images:`);
    users.forEach(user => {
      console.log(`- "${user.name} (${user.username})": ${user.image}`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();
