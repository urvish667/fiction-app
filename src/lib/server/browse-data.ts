/**
 * Server-side data fetching utilities for browse page
 * This enables SSR for better SEO and Google indexing by calling backend APIs
 * Uses Next.js built-in caching with backend Cache-Control headers
 */

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
 * Fetch stories from backend API with filters (server-side only)
 * This function should only be called from Server Components and uses unified API service
 * Relies on backend Cache-Control headers and Next.js built-in caching for performance
 */
export async function fetchBrowseStories(params: BrowseParams): Promise<BrowseResult> {
  // Use the unified StoryService method
  // Next.js will automatically cache based on backend Cache-Control headers
  return await StoryService.getBrowseStories(params, {
    serverSide: true,
    enableCache: false, // Disable Redis caching, rely on Next.js caching
    logger: logger,
  });
}
