/**
 * Script to generate story recommendations
 * 
 * This script:
 * 1. Fetches all published stories from the database
 * 2. Computes similarity scores between stories based on genres and tags
 * 3. Stores the top N most similar stories for each story in the database
 * 
 * Usage:
 * npx ts-node scripts/generateRecommendations.ts
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { computeSimilarStories, StoryWithTagsAndGenre, cosineSimilarity } from "../src/utils/similarity";

// Configuration
const MAX_RECOMMENDATIONS_PER_STORY = 10;
const SIMILARITY_THRESHOLD = 0.1; // Minimum similarity score to consider
const EXCLUDE_SAME_AUTHOR = false; // Whether to exclude stories by the same author

// Initialize Prisma client
const prisma = new PrismaClient();

async function generateRecommendations() {
  console.log("Starting recommendation generation...");
  
  try {
    // Fetch all published stories with their tags and genres
    const stories = await prisma.story.findMany({
      where: {
        status: {
          not: "draft", // Exclude draft stories
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        authorId: true,
        genreId: true,
        genre: true,
        tags: {
          select: {
            tag: true,
          },
        },
      },
    });

    console.log(`Found ${stories.length} published stories`);

    // Fetch all genres and tags
    const allGenres = await prisma.genre.findMany();
    const allTags = await prisma.tag.findMany();

    console.log(`Found ${allGenres.length} genres and ${allTags.length} tags`);

    // Process each story
    let totalRecommendations = 0;
    for (const story of stories) {
      // Compute similar stories
      const similarStories = computeSimilarStories(
        story as StoryWithTagsAndGenre,
        stories as StoryWithTagsAndGenre[],
        allGenres,
        allTags,
        cosineSimilarity,
        EXCLUDE_SAME_AUTHOR
      );

      // Filter out stories with low similarity scores and take the top N
      const topRecommendations = similarStories
        .filter((rec) => rec.score >= SIMILARITY_THRESHOLD)
        .slice(0, MAX_RECOMMENDATIONS_PER_STORY);

      if (topRecommendations.length === 0) {
        console.log(`No recommendations found for story "${story.title}" (${story.id})`);
        continue;
      }

      console.log(
        `Found ${topRecommendations.length} recommendations for story "${story.title}" (${story.id})`
      );

      // Delete existing recommendations for this story
      await prisma.storyRecommendation.deleteMany({
        where: {
          storyId: story.id,
        },
      });

      // Create new recommendations
      const recommendations = topRecommendations.map((rec) => ({
        storyId: story.id,
        recommendedStoryId: rec.story.id,
        score: rec.score,
      }));

      // Insert recommendations in batches
      await prisma.storyRecommendation.createMany({
        data: recommendations,
        skipDuplicates: true,
      });

      totalRecommendations += recommendations.length;
    }

    console.log(`Successfully generated ${totalRecommendations} recommendations`);
  } catch (error) {
    console.error("Error generating recommendations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateRecommendations()
  .then(() => {
    console.log("Recommendation generation completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
