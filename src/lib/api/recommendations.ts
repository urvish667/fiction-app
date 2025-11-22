import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";
import type { ApiResponse } from "./story";

// Types for recommendations
export interface RecommendedStory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  genre: string | null;
  tags: (string | { id: string; name: string })[];
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  chapterCount: number;
  similarityScore: number;
}

/**
 * Recommendations API service for getting story recommendations
 */
export const RecommendationService = {
  /**
   * Get recommendations for a story
   */
  async getRecommendations(
    storyId: string,
    options: {
      limit?: number;
      excludeSameAuthor?: boolean;
    } = {}
  ): Promise<ApiResponse<RecommendedStory[]>> {
    const { limit = 5, excludeSameAuthor = false } = options;

    const params = new URLSearchParams({
      limit: limit.toString(),
      excludeSameAuthor: excludeSameAuthor.toString(),
    });

    try {
      const response = await apiClient.get<{ success: boolean; data: RecommendedStory[] }>(
        `/recommendations/${storyId}?${params.toString()}`
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      // Handle 401 Unauthorized errors gracefully (user not logged in)
      if (error.status === 401) {
        logError("Recommendations require authentication", {
          context: 'Fetching recommendations',
          storyId,
          options,
          status: error.status
        });
        return {
          success: true,
          data: [] // Return empty array for unauthenticated users
        };
      }

      logError(error.message || "Failed to fetch recommendations", {
        context: 'Fetching recommendations',
        storyId,
        options,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch recommendations"
      };
    }
  },
};
