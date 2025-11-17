/**
 * Server-side data fetching utilities for browse page
 * This enables SSR for better SEO and Google indexing by calling backend APIs
 * Includes Redis caching for improved performance and reduced API load
 */

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { StoryService } from '@/lib/api/story';

export interface BrowseParams {
  genre?: string;
  tag?: string;
  tags?: string;
  search?: string;
  page?: string;
  sortBy?: string;
  status?: string;
  language?: string;
}

export interface BrowseStory {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  coverImage: string | null;
  status: string;
  isMature: boolean;
  isOriginal?: boolean;
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
  };
  genre: {
    id: string;
    name: string;
    slug: string | null;
  } | null;
  language: {
    id: string;
    name: string;
  } | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string | null;
    };
  }>;
}

export interface BrowseResult {
  stories: BrowseStory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Redis cache configuration for browse data
 */
const BROWSE_CACHE_CONFIG = {
  // Cache TTL for browse results (10 minutes)
  TTL: 10 * 60,

  // Whether Redis caching is enabled
  ENABLED: process.env.BROWSE_CACHE_ENABLED !== 'false',
};

/**
 * Generate cache key for browse results
 */
function getBrowseCacheKey(params: BrowseParams): string {
  // Sort params for consistent cache key generation
  const sortedParams = Object.keys(params)
    .filter(key => params[key as keyof BrowseParams] !== undefined)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key as keyof BrowseParams];
      return result;
    }, {} as Record<string, any>);

  const cacheKey = `browse:data:${JSON.stringify(sortedParams)}`;
  return cacheKey;
}

/**
 * Fetch stories from backend API with filters (server-side only)
 * This function should only be called from Server Components and uses unified API service
 * Includes Redis caching for improved performance and reduced API load
 */
export async function fetchBrowseStories(params: BrowseParams): Promise<BrowseResult> {
  const redis = getRedisClient();

  // Use the unified StoryService method with server-side options
  return await StoryService.getBrowseStories(params, {
    serverSide: true,
    enableCache: BROWSE_CACHE_CONFIG.ENABLED,
    redisClient: redis,
    logger: logger,
  });
}
