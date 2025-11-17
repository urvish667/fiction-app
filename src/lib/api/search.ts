import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";
import type { ApiResponse } from "./story";

// Types for suggestions
export interface SearchSuggestions {
  genres: { id: string; name: string; slug?: string }[];
  tags: { id: string; name: string; slug?: string }[];
  stories: { id: string; title: string; slug?: string }[];
}

/**
 * Search API service for getting suggestions
 */
export const SearchService = {
  /**
   * Get search suggestions
   */
  async getSuggestions(query: string): Promise<ApiResponse<SearchSuggestions>> {
    try {
      const response = await apiClient.get<SearchSuggestions>(
        `/search/suggestions?q=${encodeURIComponent(query)}`
      );

      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch search suggestions", {
        context: 'Fetching search suggestions',
        query,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch search suggestions"
      };
    }
  },
};
