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
import { logError } from "@/lib/error-logger";
import { getBaseUrl } from "@/lib/utils";

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

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/stories?${queryParams.toString()}`);

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
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/stories/${id}`);

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
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/stories/by-slug/${slug}`);

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
      logError(error, { context: 'Fetching story by slug', slug })
      return null;
    }
  },

  /**
   * Create a new story
   */
  async createStory(data: CreateStoryRequest): Promise<Story> {
    const response = await fetchWithCsrf("/api/stories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        logError(error.error || error.message || "Failed to create story", {
          context: 'Creating story',
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(error.error || error.message || "Failed to create story");
      } catch (parseError) {
        logError(`HTTP ${response.status}: ${response.statusText}`, {
          context: 'Creating story',
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`Failed to create story: ${response.status} ${response.statusText}`);
      }
    }

    const result = await response.json();
    return result;
  },

  /**
   * Update a story
   */
  async updateStory(id: string, data: UpdateStoryRequest): Promise<Story> {
    const response = await fetchWithCsrf(`/api/stories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        logError(error.error || error.message || "Failed to update story", {
          context: 'Updating story',
          storyId: id,
          status: response.status,
          statusText: response.statusText,
          errorDetails: error.details || error,
          requestData: data
        });
        throw new Error(error.error || error.message || "Failed to update story");
      } catch (parseError) {
        logError(`HTTP ${response.status}: ${response.statusText}`, {
          context: 'Updating story',
          storyId: id,
          status: response.status,
          statusText: response.statusText,
          requestData: data
        });
        throw new Error(`Failed to update story: ${response.status} ${response.statusText}`);
      }
    }

    const result = await response.json();
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
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/stories/${storyId}/chapters`);

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
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/stories/${storyId}/chapters/${chapterId}`);

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
      try {
        const error = await response.json();
        logError(error.error || error.message || "Failed to update chapter", {
          context: 'Updating chapter',
          storyId: storyId,
          chapterId: chapterId,
          status: response.status,
          statusText: response.statusText,
          errorDetails: error.details || error,
          requestData: data
        });
        throw new Error(error.error || error.message || "Failed to update chapter");
      } catch (parseError) {
        logError(`HTTP ${response.status}: ${response.statusText}`, {
          context: 'Updating chapter',
          storyId: storyId,
          chapterId: chapterId,
          status: response.status,
          statusText: response.statusText,
          requestData: data
        });
        throw new Error(`Failed to update chapter: ${response.status} ${response.statusText}`);
      }
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
   * Like a chapter
   */
  async likeChapter(storyId: string, chapterId: string): Promise<{ like: any; likeCount: number }> {
    try {
      const response = await fetchWithCsrf(`/api/stories/${storyId}/chapters/${chapterId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        // Check if the response has content before trying to parse it
        const text = await response.text();
        let errorData = { error: `Failed to like chapter: ${response.status} ${response.statusText}` };

        if (text) {
          try {
            errorData = JSON.parse(text);
          } catch (parseError) {
            logError(parseError, { context: 'Parsing error response', responseText: text })
            // Keep the default error message
          }
        }

        logError(errorData, { context: 'Liking chapter', storyId, chapterId })
        throw new Error(errorData.error || `Failed to like chapter: ${response.status} ${response.statusText}`);
      }

      // Check if the response has content before trying to parse it
      const text = await response.text();
      if (!text) {
        return { like: null, likeCount: 0 };
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        logError(parseError, { context: 'Parsing success response', responseText: text })
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      logError(error, { context: 'Liking chapter', storyId, chapterId })
      throw error;
    }
  },

  /**
   * Unlike a chapter
   */
  async unlikeChapter(storyId: string, chapterId: string): Promise<{ likeCount: number }> {
    try {
      const response = await fetchWithCsrf(`/api/stories/${storyId}/chapters/${chapterId}/like`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Check if the response has content before trying to parse it
        const text = await response.text();
        let errorData = { error: `Failed to unlike chapter: ${response.status} ${response.statusText}` };

        if (text) {
          try {
            errorData = JSON.parse(text);
          } catch (parseError) {
            logError(parseError, { context: 'Parsing error response', responseText: text })
            // Keep the default error message
          }
        }

        logError(errorData, { context: 'Unliking chapter', storyId, chapterId })
        throw new Error(errorData.error || `Failed to unlike chapter: ${response.status} ${response.statusText}`);
      }

      // Check if the response has content before trying to parse it
      const text = await response.text();
      if (!text) {
        return { likeCount: 0 };
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        logError(parseError, { context: 'Parsing success response', responseText: text })
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      logError(error, { context: 'Unliking chapter', storyId, chapterId })
      throw error;
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

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/user/bookmarks?${queryParams.toString()}`);

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
      // For profile completion errors, throw the full error object
      if (response.status === 403 && error.code === 'PROFILE_INCOMPLETE') {
        throw error;
      }
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
      // For profile completion errors, throw the full error object
      if (response.status === 403 && error.code === 'PROFILE_INCOMPLETE') {
        throw error;
      }
      throw new Error(error.error || "Failed to unfollow user");
    }
  },

  /**
   * Check if the current user is following another user
   */
  async isFollowingUser(username: string): Promise<boolean> {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/user/${username}/follow/status`);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isFollowing;
    } catch (error) {
      logError(error, { context: 'Checking follow status', username })
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

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/user/${username}/followers?${queryParams.toString()}`);

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

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/user/${username}/following?${queryParams.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch following");
    }

    return response.json();
  },
};
