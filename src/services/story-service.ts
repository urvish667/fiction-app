import {
  Story,
  Chapter,
  CreateStoryRequest,
  UpdateStoryRequest,
  CreateChapterRequest,
  UpdateChapterRequest,
  StoryResponse,
  ChapterResponse
} from "@/types/story";
import { fetchWithCsrf } from "@/lib/client/csrf";

/**
 * Service for interacting with the story API endpoints
 */
export const StoryService = {
  /**
   * Get all stories with optional filtering
   */
  async getStories(params?: {
    page?: number;
    limit?: number;
    genre?: string;
    authorId?: string;
    status?: string | string[];
    search?: string;
    tags?: string | string[];
    language?: string;
    sortBy?: string;
  }): Promise<{ stories: StoryResponse[]; pagination: any }> {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          // Handle tags array by converting to comma-separated string
          if (key === 'tags' && Array.isArray(value) && value.length > 0) {
            queryParams.append(key, value.join(','));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`/api/stories?${queryParams.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch stories");
    }

    return response.json();
  },

  /**
   * Get a story by ID
   */
  async getStory(id: string): Promise<StoryResponse> {
    const response = await fetch(`/api/stories/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch story");
    }

    return response.json();
  },

  /**
   * Get a story by slug
   */
  async getStoryBySlug(slug: string): Promise<StoryResponse | null> {
    try {
      // First, try to find stories with exact slug match
      const response = await fetch(`/api/stories/by-slug/${slug}`);

      if (!response.ok) {
        // If the dedicated endpoint fails, fall back to search
        const stories = await this.getStories({
          search: slug,
          limit: 1
        });

        if (stories.stories.length === 0) {
          return null;
        }

        // Get the first story that matches
        const storyId = stories.stories[0].id;
        return await this.getStory(storyId);
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching story by slug:", error);
      return null;
    }
  },

  /**
   * Create a new story
   */
  async createStory(data: CreateStoryRequest): Promise<Story> {
    console.log('StoryService.createStory called with data:', data);
    const response = await fetchWithCsrf("/api/stories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Create story failed:', error);
      throw new Error(error.error || "Failed to create story");
    }

    const result = await response.json();
    console.log('Create story succeeded, result:', result);
    return result;
  },

  /**
   * Update a story
   */
  async updateStory(id: string, data: UpdateStoryRequest): Promise<Story> {
    console.log('StoryService.updateStory called with id:', id, 'data:', data);
    const response = await fetchWithCsrf(`/api/stories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Update story failed:', error);
      throw new Error(error.error || "Failed to update story");
    }

    const result = await response.json();
    console.log('Update story succeeded, result:', result);
    return result;
  },

  /**
   * Delete a story
   */
  async deleteStory(id: string): Promise<void> {
    const response = await fetchWithCsrf(`/api/stories/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete story");
    }
  },

  /**
   * Get all chapters for a story
   */
  async getChapters(storyId: string): Promise<ChapterResponse[]> {
    const response = await fetch(`/api/stories/${storyId}/chapters`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch chapters");
    }

    return response.json();
  },

  /**
   * Get a specific chapter
   */
  async getChapter(storyId: string, chapterId: string): Promise<ChapterResponse> {
    const response = await fetch(`/api/stories/${storyId}/chapters/${chapterId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch chapter");
    }

    return response.json();
  },

  /**
   * Create a new chapter
   */
  async createChapter(storyId: string, data: CreateChapterRequest): Promise<Chapter> {
    const response = await fetchWithCsrf(`/api/stories/${storyId}/chapters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage = error.message ? `${error.error}: ${error.message}` : error.error || "Failed to create chapter";
      throw new Error(errorMessage);
    }

    return response.json();
  },

  /**
   * Update a chapter
   */
  async updateChapter(storyId: string, chapterId: string, data: UpdateChapterRequest): Promise<Chapter> {
    const response = await fetchWithCsrf(`/api/stories/${storyId}/chapters/${chapterId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update chapter");
    }

    return response.json();
  },

  /**
   * Delete a chapter
   */
  async deleteChapter(storyId: string, chapterId: string): Promise<void> {
    const response = await fetchWithCsrf(`/api/stories/${storyId}/chapters/${chapterId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete chapter");
    }
  },

  /**
   * Update reading progress
   */
  async updateReadingProgress(chapterId: string, progress: number): Promise<any> {
    const response = await fetchWithCsrf("/api/reading-progress", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chapterId, progress }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update reading progress");
    }

    return response.json();
  },

  /**
   * Like a story
   */
  async likeStory(storyId: string): Promise<any> {
    const response = await fetchWithCsrf(`/api/stories/${storyId}/like`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to like story");
    }

    return response.json();
  },

  /**
   * Unlike a story
   */
  async unlikeStory(storyId: string): Promise<void> {
    const response = await fetchWithCsrf(`/api/stories/${storyId}/like`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to unlike story");
    }
  },

  /**
   * Bookmark a story
   */
  async bookmarkStory(storyId: string): Promise<any> {
    const response = await fetchWithCsrf(`/api/stories/${storyId}/bookmark`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to bookmark story");
    }

    return response.json();
  },

  /**
   * Remove a bookmark
   */
  async removeBookmark(storyId: string): Promise<void> {
    const response = await fetchWithCsrf(`/api/stories/${storyId}/bookmark`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to remove bookmark");
    }
  },

  /**
   * Get bookmarked stories for a user
   */
  async getBookmarkedStories(params?: {
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<{ stories: StoryResponse[]; pagination: any }> {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`/api/user/bookmarks?${queryParams.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch bookmarked stories");
    }

    return response.json();
  },

  /**
   * Follow a user
   */
  async followUser(username: string): Promise<any> {
    const response = await fetchWithCsrf(`/api/user/${username}/follow`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to follow user");
    }

    return response.json();
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(username: string): Promise<void> {
    const response = await fetchWithCsrf(`/api/user/${username}/follow`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to unfollow user");
    }
  },

  /**
   * Check if the current user is following another user
   */
  async isFollowingUser(username: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/user/${username}/follow/status`);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isFollowing;
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  },

  /**
   * Get followers for a user
   */
  async getFollowers(username: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ followers: any[]; pagination: any }> {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`/api/user/${username}/followers?${queryParams.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch followers");
    }

    return response.json();
  },

  /**
   * Get users that a user is following
   */
  async getFollowing(username: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ following: any[]; pagination: any }> {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`/api/user/${username}/following?${queryParams.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch following");
    }

    return response.json();
  },
};
