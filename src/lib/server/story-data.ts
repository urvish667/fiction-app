/**
 * Server-side data fetching utilities for story pages
 * Enables SSR for SEO and indexing.
 * Uses React cache() for request deduplication between generateMetadata and page render.
 */

import { cache } from 'react';
import { logger } from '@/lib/logger';
import { StoryService } from '@/lib/api/story';
import { ChapterService } from '@/lib/api/chapter';
import type { StoryResponse, ChapterResponse } from '@/types/story';

/**
 * Fetch story data from backend API (server-side only)
 * Deduplicated per-request via React cache() so generateMetadata and page render share the exact same call.
 */
export const fetchStoryData = cache(
  async (slug: string): Promise<(StoryResponse & { viewCount: number; chapters: ChapterResponse[] }) | null> => {
    try {
      const response = await StoryService.getStoryBySlug(slug);

      if (!response.success || !response.data) {
        logger.warn(`Story not found: ${slug}`);
        return null;
      }

      const storyData = response.data;
      const chaptersResponse = await ChapterService.getChapters(storyData.id);

      if (!chaptersResponse.success) {
        logger.warn(`Failed to fetch chapters for story: ${slug}`);
        return null;
      }

      // Filter out draft and scheduled chapters for public story page
      const publishedChapters = (chaptersResponse.data || []).filter(
        (chapter) => chapter.status === 'published'
      );

      return {
        ...storyData,
        viewCount: storyData.readCount || 0,
        chapters: publishedChapters,
      };
    } catch (error: any) {
      logger.error('Error fetching story data:', error);
      return null;
    }
  }
);

export interface ChapterPageBundle {
  story: StoryResponse;
  chapter: ChapterResponse;
  publishedChapters: ChapterResponse[];
}

/**
 * Fetch all data required for a chapter page (story, target chapter, published chapters list).
 * Deduplicated per-request via React cache() so generateMetadata and page render share the exact same call.
 */
export const fetchChapterPageData = cache(
  async (slug: string, chapterNumber: number): Promise<ChapterPageBundle | null> => {
    try {
      const storyResponse = await StoryService.getStoryBySlug(slug);
      if (!storyResponse.success || !storyResponse.data) {
        logger.warn(`Story not found for chapter page: ${slug}`);
        return null;
      }

      const story = storyResponse.data;
      const chaptersResponse = await ChapterService.getChapters(story.id);
      if (!chaptersResponse.success || !chaptersResponse.data) {
        logger.warn(`Failed to fetch chapters for story: ${slug}`);
        return null;
      }

      const publishedChapters = (chaptersResponse.data || []).filter(
        (c) => c.status === 'published'
      );
      const targetChapterMeta = publishedChapters.find((c) => c.number === chapterNumber);
      if (!targetChapterMeta) {
        logger.warn(`Chapter number ${chapterNumber} not found in published chapters for: ${slug}`);
        return null;
      }

      const chapterResponse = await ChapterService.getChapter(targetChapterMeta.id);
      if (!chapterResponse.success || !chapterResponse.data) {
        logger.warn(`Failed to fetch chapter detail for chapter ID ${targetChapterMeta.id}`);
        return null;
      }

      const chapter = chapterResponse.data;
      if (chapter.status !== 'published') {
        return null;
      }

      return {
        story,
        chapter,
        publishedChapters,
      };
    } catch (error: any) {
      logger.error('Error fetching chapter page bundle:', error);
      return null;
    }
  }
);

