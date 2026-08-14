import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";
import type { Chapter, ChapterResponse, CreateChapterRequest, UpdateChapterRequest } from "@/types/story";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
}

export interface ChaptersResponse {
  chapters: ChapterResponse[];
}

export interface ChapterLikeResponse {
  like: any;
  likeCount: number;
}

export interface ChapterUnlikeResponse {
  likeCount: number;
}

/**
 * Chapter API service for interacting with the REST API endpoints
 */
export const ChapterService = {
  /**
   * Get all chapters for a story
   */
  async getChapters(storyId: string): Promise<ApiResponse<ChapterResponse[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: ChapterResponse[];
      }>(`/stories/${storyId}/chapters`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch chapters", {
        context: 'Fetching chapters',
        storyId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch chapters"
      };
    }
  },

  /**
   * Get a specific chapter by ID
   */
  async getChapter(chapterId: string): Promise<ApiResponse<ChapterResponse>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: ChapterResponse;
      }>(`/chapters/${chapterId}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch chapter", {
        context: 'Fetching chapter',
        chapterId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch chapter"
      };
    }
  },

  /**
   * Create a new chapter
   */
  async createChapter(storyId: string, data: CreateChapterRequest): Promise<ApiResponse<Chapter>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: Chapter;
        message: string;
      }>(`/stories/${storyId}/chapters`, data);

      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to create chapter", {
        context: 'Creating chapter',
        storyId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to create chapter"
      };
    }
  },

  /**
   * Update a chapter
   */
  async updateChapter(chapterId: string, data: UpdateChapterRequest): Promise<ApiResponse<Chapter>> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: Chapter;
        message: string;
      }>(`/chapters/${chapterId}`, data);

      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to update chapter", {
        context: 'Updating chapter',
        chapterId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to update chapter"
      };
    }
  },

  /**
   * Delete a chapter
   */
  async deleteChapter(chapterId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/chapters/${chapterId}`);

      return {
        success: true,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to delete chapter", {
        context: 'Deleting chapter',
        chapterId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to delete chapter"
      };
    }
  },

  /**
   * Like a chapter
   */
  async likeChapter(chapterId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: any;
        message: string;
      }>(`/chapters/${chapterId}/like`);

      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to like chapter", {
        context: 'Liking chapter',
        chapterId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to like chapter"
      };
    }
  },

  /**
   * Unlike a chapter
   */
  async unlikeChapter(chapterId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        data: any;
        message: string;
      }>(`/chapters/${chapterId}/like`);

      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to unlike chapter", {
        context: 'Unliking chapter',
        chapterId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to unlike chapter"
      };
    }
  },

  /**
   * Check if a chapter is liked by the current user
   */
  async checkChapterLike(chapterId: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.get<{
        isLiked: boolean;
      }>(`/chapters/${chapterId}/like/check`);

      return {
        success: true,
        data: response.isLiked
      };
    } catch (error: any) {
      logError(error.message || "Failed to check chapter like status", {
        context: 'Checking chapter like status',
        chapterId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to check chapter like status",
        data: false
      };
    }
  },

  /**
   * Update reading progress for a chapter
   */
  async updateReadingProgress(chapterId: string, progress: number): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: any;
        message: string;
      }>("/reading-progress", { chapterId, progress });

      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to update reading progress", {
        context: 'Updating reading progress',
        chapterId,
        progress,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to update reading progress"
      };
    }
  },
};
