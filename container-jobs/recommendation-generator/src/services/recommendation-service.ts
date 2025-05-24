/**
 * Service for generating story recommendations
 */

import { PrismaClient } from "@prisma/client";
import { computeSimilarStories, StoryWithTagsAndGenre, cosineSimilarity } from "../utils/similarity";
import { logger } from "../utils/logger";
import { appConfig } from "../config";

export class RecommendationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: appConfig.environment === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  /**
   * Generate recommendations for all published stories
   */
  async generateRecommendations(): Promise<void> {
    logger.info("Starting recommendation generation...");

    try {
      // Fetch all published stories with their tags and genres
      const stories = await this.fetchPublishedStories();
      logger.info(`Found ${stories.length} published stories`);

      if (stories.length === 0) {
        logger.warn("No published stories found. Skipping recommendation generation.");
        return;
      }

      // Fetch all genres and tags
      const [allGenres, allTags] = await Promise.all([
        this.prisma.genre.findMany(),
        this.prisma.tag.findMany(),
      ]);

      logger.info(`Found ${allGenres.length} genres and ${allTags.length} tags`);

      // Process each story
      let totalRecommendations = 0;
      let processedStories = 0;

      for (const story of stories) {
        try {
          const recommendationCount = await this.processStory(
            story as StoryWithTagsAndGenre,
            stories as StoryWithTagsAndGenre[],
            allGenres,
            allTags
          );

          totalRecommendations += recommendationCount;
          processedStories++;

          // Log progress every 100 stories
          if (processedStories % 100 === 0) {
            logger.info(`Processed ${processedStories}/${stories.length} stories`);
          }
        } catch (error) {
          logger.error(`Error processing story "${story.title}" (${story.id})`, { error: error instanceof Error ? error.message : error });
          // Continue processing other stories
        }
      }

      logger.info(`Successfully generated ${totalRecommendations} recommendations for ${processedStories} stories`);
    } catch (error) {
      logger.error("Error generating recommendations", { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Fetch all published stories with their relationships
   */
  private async fetchPublishedStories() {
    return await this.prisma.story.findMany({
      where: {
        status: {
          not: "draft", // Exclude draft stories
        },
      },
      include: {
        genre: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  /**
   * Process a single story to generate recommendations
   */
  private async processStory(
    story: StoryWithTagsAndGenre,
    allStories: StoryWithTagsAndGenre[],
    allGenres: any[],
    allTags: any[]
  ): Promise<number> {
    // Compute similar stories
    const similarStories = computeSimilarStories(
      story,
      allStories,
      allGenres,
      allTags,
      cosineSimilarity,
      appConfig.recommendations.excludeSameAuthor
    );

    // Filter out stories with low similarity scores and take the top N
    const topRecommendations = similarStories
      .filter((rec) => rec.score >= appConfig.recommendations.similarityThreshold)
      .slice(0, appConfig.recommendations.maxRecommendationsPerStory);

    if (topRecommendations.length === 0) {
      logger.debug(`No recommendations found for story "${story.title}" (${story.id})`);
      return 0;
    }

    logger.debug(
      `Found ${topRecommendations.length} recommendations for story "${story.title}" (${story.id})`
    );

    // Delete existing recommendations for this story
    await this.prisma.storyRecommendation.deleteMany({
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
    await this.prisma.storyRecommendation.createMany({
      data: recommendations,
      skipDuplicates: true,
    });

    return recommendations.length;
  }

  /**
   * Clean up database connections
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
    logger.info("Database connections closed");
  }
}
