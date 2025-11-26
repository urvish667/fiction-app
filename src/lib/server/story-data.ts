/**
 * Server-side data fetching utilities for story pages
 * This enables SSR for better SEO and Google indexing by calling backend APIs
 * Uses Next.js built-in caching with backend Cache-Control headers
 */

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
 * Fetch story data from backend API (server-side only)
 * This function should only be called from Server Components and uses unified API service
 * Relies on backend Cache-Control headers and Next.js built-in caching for performance
 */
export async function fetchStoryData(slug: string): Promise<StoryResponse & { viewCount: number; chapters: ChapterResponse[] } | null> {
  try {
    // Fetch story from backend API
    // Next.js will automatically cache this based on backend Cache-Control headers
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

    return storyWithViewCount;
  } catch (error: any) {
    logger.error("Error fetching story data:", error);
    return null;
  }
}
