/**
 * Recommendation Service
 * 
 * This service handles the generation of story recommendations based on genre and tag similarity.
 * It provides functions for computing and storing recommendations in the database.
 */

import { PrismaClient, Prisma, Story, Genre, Tag } from "@prisma/client";
import { computeSimilarStories, cosineSimilarity } from "@/utils/similarity";
import { logger } from "@/lib/logger";

// Create a dedicated logger for the recommendation service
const recommendationLogger = logger.child("recommendation-service");

// Configuration
export interface RecommendationConfig {
  maxRecommendationsPerStory: number;
  similarityThreshold: number;
  excludeSameAuthor: boolean;
  batchSize?: number; // For processing stories in batches
}

// Default configuration
export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  maxRecommendationsPerStory: 10,
  similarityThreshold: 0.1,
  excludeSameAuthor: true,
  batchSize: 50, // Process 50 stories at a time
};

// Type for story with tags and genre
export type StoryWithTagsAndGenre = Story & {
  genre: Genre | null;
  tags: {
    tag: Tag;
  }[];
};

/**
 * Generate recommendations for all stories
 * 
 * @param prisma Prisma client instance
 * @param config Configuration options
 * @returns Object with counts of processed stories and generated recommendations
 */
export async function generateRecommendations(
  prisma: PrismaClient,
  config: Partial<RecommendationConfig> = {}
): Promise<{
  processedStories: number;
  totalRecommendations: number;
  errors: number;
}> {
  // Merge provided config with defaults
  const mergedConfig: RecommendationConfig = {
    ...DEFAULT_RECOMMENDATION_CONFIG,
    ...config,
  };

  recommendationLogger.info("Starting recommendation generation...", {
    config: mergedConfig,
  });

  let processedStories = 0;
  let totalRecommendations = 0;
  let errors = 0;

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

    recommendationLogger.info(`Found ${stories.length} published stories`);

    // Fetch all genres and tags
    const allGenres = await prisma.genre.findMany();
    const allTags = await prisma.tag.findMany();

    recommendationLogger.debug(`Found ${allGenres.length} genres and ${allTags.length} tags`);

    // Process stories in batches if batchSize is specified
    const batchSize = mergedConfig.batchSize || stories.length;
    const batches = Math.ceil(stories.length / batchSize);

    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, stories.length);
      const batchStories = stories.slice(start, end);

      recommendationLogger.debug(`Processing batch ${batchIndex + 1}/${batches} with ${batchStories.length} stories`);

      // Process each story in the batch
      for (const story of batchStories) {
        try {
          // Compute similar stories
          const similarStories = computeSimilarStories(
            story as StoryWithTagsAndGenre,
            stories as StoryWithTagsAndGenre[],
            allGenres,
            allTags,
            cosineSimilarity,
            mergedConfig.excludeSameAuthor
          );

          // Validate similarity scores
          const validSimilarStories = similarStories.filter((rec) => {
            // Check for NaN or invalid scores
            if (isNaN(rec.score) || rec.score < 0 || rec.score > 1) {
              recommendationLogger.warn(`Invalid similarity score for story pair: ${story.id} -> ${rec.story.id}, score: ${rec.score}`);
              return false;
            }
            return true;
          });

          // Filter out stories with low similarity scores and take the top N
          const topRecommendations = validSimilarStories
            .filter((rec) => rec.score >= mergedConfig.similarityThreshold)
            .slice(0, mergedConfig.maxRecommendationsPerStory);

          if (topRecommendations.length === 0) {
            recommendationLogger.debug(`No recommendations found for story "${story.title}" (${story.id})`);
            processedStories++;
            continue;
          }

          recommendationLogger.debug(
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
          processedStories++;
        } catch (error) {
          recommendationLogger.error(`Error processing story "${story.title}" (${story.id})`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          errors++;
        }
      }
    }

    recommendationLogger.info(`Successfully generated ${totalRecommendations} recommendations for ${processedStories} stories`);
    return { processedStories, totalRecommendations, errors };
  } catch (error) {
    recommendationLogger.error("Error generating recommendations", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Generate recommendations for a specific story
 * 
 * @param prisma Prisma client instance
 * @param storyId ID of the story to generate recommendations for
 * @param config Configuration options
 * @returns Number of recommendations generated
 */
export async function generateRecommendationsForStory(
  prisma: PrismaClient,
  storyId: string,
  config: Partial<RecommendationConfig> = {}
): Promise<number> {
  // Merge provided config with defaults
  const mergedConfig: RecommendationConfig = {
    ...DEFAULT_RECOMMENDATION_CONFIG,
    ...config,
  };

  recommendationLogger.info(`Generating recommendations for story ${storyId}`, {
    config: mergedConfig,
  });

  try {
    // Fetch the target story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
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

    if (!story) {
      recommendationLogger.warn(`Story ${storyId} not found`);
      return 0;
    }

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

    // Fetch all genres and tags
    const allGenres = await prisma.genre.findMany();
    const allTags = await prisma.tag.findMany();

    // Compute similar stories
    const similarStories = computeSimilarStories(
      story as StoryWithTagsAndGenre,
      stories as StoryWithTagsAndGenre[],
      allGenres,
      allTags,
      cosineSimilarity,
      mergedConfig.excludeSameAuthor
    );

    // Validate similarity scores
    const validSimilarStories = similarStories.filter((rec) => {
      // Check for NaN or invalid scores
      if (isNaN(rec.score) || rec.score < 0 || rec.score > 1) {
        recommendationLogger.warn(`Invalid similarity score for story pair: ${story.id} -> ${rec.story.id}, score: ${rec.score}`);
        return false;
      }
      return true;
    });

    // Filter out stories with low similarity scores and take the top N
    const topRecommendations = validSimilarStories
      .filter((rec) => rec.score >= mergedConfig.similarityThreshold)
      .slice(0, mergedConfig.maxRecommendationsPerStory);

    if (topRecommendations.length === 0) {
      recommendationLogger.debug(`No recommendations found for story "${story.title}" (${story.id})`);
      return 0;
    }

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

    recommendationLogger.info(`Generated ${recommendations.length} recommendations for story "${story.title}" (${story.id})`);
    return recommendations.length;
  } catch (error) {
    recommendationLogger.error(`Error generating recommendations for story ${storyId}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
