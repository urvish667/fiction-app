/**
 * Server-side data fetching utilities for story pages
 * This enables SSR for better SEO and Google indexing by calling backend APIs
 * Includes Redis caching for improved performance and reduced API load
 */

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { StoryService } from '@/lib/api/story';
import { ChapterService } from '@/lib/api/chapter';
import { StoryResponse, ChapterResponse } from '@/types/story';

interface StoryParams {
  slug: string;
}

export interface ServerStory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  isMature: boolean;
  isOriginal: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  wordCount: number;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    donationsEnabled: boolean;
    donationMethod: string | null;
    donationLink: string | null;
  };
  genre: {
    id: string;
    name: string;
  } | null;
  language: {
    id: string;
    name: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string | null;
  }>;
  chapters: Array<{
    id: string;
    number: number;
    title: string;
    wordCount: number;
    readCount: number;
    status: string;
    publishDate: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

/**
 * Redis cache configuration for story data
 */
const STORY_CACHE_CONFIG = {
  // Cache TTL for story results (5 minutes - stories change less frequently than browse data)
  TTL: 5 * 60,

  // Whether Redis caching is enabled
  ENABLED: process.env.STORY_CACHE_ENABLED !== 'false',
};

/**
 * Generate cache key for story data
 */
function getStoryCacheKey(slug: string): string {
  return `story:data:${slug}`;
}

/**
 * Fetch story data from backend API with caching (server-side only)
 * This function should only be called from Server Components and uses unified API service
 * Includes Redis caching for improved performance and reduced API load, similar to browse-data.ts
 */
export async function fetchStoryData(slug: string): Promise<StoryResponse & { viewCount: number; chapters: ChapterResponse[] } | null> {
  const redis = getRedisClient();

  // Check cache first
  if (STORY_CACHE_CONFIG.ENABLED && redis) {
    try {
      const cacheKey = getStoryCacheKey(slug);
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        logger.debug(`[Redis] Story cache hit for key: ${cacheKey}`);
        return JSON.parse(cachedData);
      }
      logger.debug(`[Redis] Story cache miss for key: ${cacheKey}`);
    } catch (cacheError) {
      logger.error('Error reading from story cache:', cacheError);
      // Continue to API call on cache error
    }
  }

  try {
    // Fetch story from backend API
    const response = await StoryService.getStoryBySlug(slug);

    if (!response.success || !response.data) {
      logger.warn(`Story not found: ${slug}`);
      return null;
    }

    const storyData = response.data;

    // Fetch chapters for this story
    const chaptersResponse = await ChapterService.getChapters(storyData.id);

    if (!chaptersResponse.success) {
      logger.warn(`Failed to fetch chapters for story: ${slug}`);
      return null;
    }

    // Filter out draft and scheduled chapters for public story page
    const publishedChapters = (chaptersResponse.data || []).filter(chapter =>
      chapter.status === 'published'
    );

    // Use readCount from the story data (synced from Redis every 12 hours)
    // This is more efficient than real-time Redis queries for every page load
    const viewCount = storyData.readCount || 0;

    // Return the story data as-is from API, adding view count
    const storyWithViewCount = {
      ...storyData,
      viewCount: viewCount,
      chapters: publishedChapters,
    };

    // Cache the result if caching is enabled and story has chapters
    if (STORY_CACHE_CONFIG.ENABLED && redis && storyWithViewCount.chapters && storyWithViewCount.chapters.length > 0) {
      try {
        const cacheKey = getStoryCacheKey(slug);
        await redis.setex(cacheKey, STORY_CACHE_CONFIG.TTL, JSON.stringify(storyWithViewCount));
        logger.debug(`[Redis] Cached story result for key: ${cacheKey}`);
      } catch (cacheError) {
        logger.error('Error caching story result:', cacheError);
        // Don't throw - caching failure shouldn't break the response
      }
    }

    return storyWithViewCount;
  } catch (error: any) {
    logger.error("Error fetching story data:", error);
    return null;
  }
}
