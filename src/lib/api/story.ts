import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";
import type {
  Story,
  CreateStoryRequest,
  UpdateStoryRequest,
  StoryResponse,
  StoryRecommendation
} from "@/types/story";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
}

/**
 * Story API service for interacting with the REST API endpoints
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
    isMature?: boolean;
    isOriginal?: boolean;
  }): Promise<ApiResponse<{ stories: StoryResponse[]; pagination: any }>> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            // Handle arrays by appending multiple parameters with same key
            if ((key === 'tags' || key === 'status') && Array.isArray(value) && value.length > 0) {
              value.forEach(item => queryParams.append(key, String(item)));
            } else {
              queryParams.append(key, String(value));
            }
          }
        });
      }

      const query = queryParams.toString();
      const url = query ? `/stories?${query}` : '/stories';

      const response = await apiClient.get<{
        success: boolean;
        data: StoryResponse[];
        meta: any;
      }>(url);

      return {
        success: true,
        data: {
          stories: response.data,
          pagination: response.meta
        }
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch stories", {
        context: 'Fetching stories',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch stories"
      };
    }
  },

  /**
   * Get stories for browse page with caching and transformation (server-side compatible)
   * Includes Redis caching when server-side, uses unified error handling
   */
  async getBrowseStories(params: {
    page?: string;
    limit?: number;
    genre?: string;
    tag?: string;
    tags?: string;
    search?: string;
    sortBy?: string;
    status?: string;
    language?: string;
  }, options?: {
    serverSide?: boolean;
    enableCache?: boolean;
    redisClient?: any;
    logger?: any;
  }): Promise<{
    stories: Array<{
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
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { serverSide = false, enableCache = true, redisClient, logger } = options || {};

    // Server-side cache check
    if (serverSide && enableCache && redisClient) {
      try {
        // Generate cache key (similar to original browse-data logic)
        const sortedParams = Object.keys(params)
          .filter(key => params[key as keyof typeof params] !== undefined)
          .sort()
          .reduce((result: Record<string, any>, key) => {
            result[key] = params[key as keyof typeof params];
            return result;
          }, {} as Record<string, any>);

        const cacheKey = `browse:data:${JSON.stringify(sortedParams)}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
          if (logger) {
            logger.debug(`[Redis] Browse cache hit for key: ${cacheKey}`);
          }
          return JSON.parse(cachedData);
        }
        if (logger) {
          logger.debug(`[Redis] Browse cache miss for key: ${cacheKey}`);
        }
      } catch (cacheError) {
        if (logger) {
          logger.error('Error reading from browse cache:', cacheError);
        }
        // Continue to API call on cache error
      }
    }

    try {
      // Build API parameters
      const apiParams: Record<string, any> = {
        page: parseInt(params.page || "1"),
        limit: params.limit || 16,
      };

      // Add filters
      if (params.genre) {
        apiParams.genre = params.genre;
      }
      if (params.language) {
        apiParams.language = params.language;
      }

      // Handle tags - backend expects array or single tag
      const tagsToFilter = params.tag ? [params.tag] : (params.tags ? params.tags.split(',').map(t => t.trim()) : []);
      if (tagsToFilter.length > 0) {
        apiParams.tags = tagsToFilter;
      }

      // Status filter - map to backend expected format
      if (params.status && params.status !== "all") {
        apiParams.status = params.status;
      } else if (params.status === "all") {
        // Default behavior - show published stories
        apiParams.status = 'ongoing,completed';
      }

      if (params.search) {
        apiParams.search = params.search;
      }

      // Map sort options to backend expected values
      const sortBy = params.sortBy;
      if (sortBy) {
        switch (sortBy) {
          case 'newest':
            apiParams.sortBy = 'newest';
            break;
          case 'popular':
            apiParams.sortBy = 'popular';
            break;
          case 'mostRead':
            apiParams.sortBy = 'mostViewed';
            break;
          default:
            apiParams.sortBy = 'newest';
        }
      }

      // Use StoryService's underlying API call
      const response = await this.getStories(apiParams);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch browse stories");
      }

      const { stories, pagination } = response.data;

      // Transform stories to browse format
      const transformedStories: Array<{
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
      }> = stories.map((story: any) => ({
        id: story.id,
        title: story.title,
        slug: story.slug,
        description: story.description,
        coverImage: story.coverImage,
        status: story.status,
        isMature: story.isMature,
        isOriginal: story.isOriginal,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
        likeCount: story.likeCount || 0,
        commentCount: story.commentCount || 0,
        viewCount: story.readCount || 0,
        wordCount: story.wordCount || 0,
        author: story.author,
        genre: story.genre,
        language: story.language,
        tags: story.tags?.map((tag: any) => ({
          tag: {
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
          }
        })) || [],
      }));

      const result = {
        stories: transformedStories,
        pagination: {
          page: pagination?.page || parseInt(params.page || "1"),
          limit: pagination?.limit || 16,
          total: pagination?.total || 0,
          totalPages: pagination?.totalPages || 0,
        }
      };

      // Server-side caching
      if (serverSide && enableCache && redisClient && result.stories.length > 0) {
        try {
          const sortedParams = Object.keys(params)
            .filter(key => params[key as keyof typeof params] !== undefined)
            .sort()
            .reduce((accumulator: Record<string, any>, key) => {
              accumulator[key] = params[key as keyof typeof params];
              return accumulator;
            }, {} as Record<string, any>);

          const cacheKey = `browse:data:${JSON.stringify(sortedParams)}`;
          const cacheTTL = 10 * 60; // 10 minutes
          await redisClient.setex(cacheKey, cacheTTL, JSON.stringify(result));
          if (logger) {
            logger.debug(`[Redis] Cached browse result for key: ${cacheKey}`);
          }
        } catch (cacheError) {
          if (logger) {
            logger.error('Error caching browse result:', cacheError);
          }
          // Don't throw - caching failure shouldn't break the response
        }
      }

      return result;
    } catch (error: any) {
      if (logger) {
        logger.error("Error fetching browse stories:", error);
      }

      // Return empty result on error to gracefully degrade
      return {
        stories: [],
        pagination: {
          page: parseInt(params.page || "1"),
          limit: params.limit || 16,
          total: 0,
          totalPages: 0,
        }
      };
    }
  },

  /**
   * Get a story by ID
   */
  async getStory(id: string): Promise<ApiResponse<StoryResponse>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: StoryResponse;
      }>(`/stories/${id}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch story", {
        context: 'Fetching story',
        storyId: id,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch story"
      };
    }
  },

  /**
   * Get a story by slug
   */
  async getStoryBySlug(slug: string): Promise<ApiResponse<StoryResponse | null>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: StoryResponse;
      }>(`/stories/slug/${slug}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      // If story not found, return null instead of error
      if (error.status === 404) {
        return {
          success: true,
          data: null
        };
      }

      logError(error.message || "Failed to fetch story by slug", {
        context: 'Fetching story by slug',
        slug,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch story by slug"
      };
    }
  },

  /**
   * Create a new story
   */
  async createStory(data: CreateStoryRequest): Promise<ApiResponse<Story>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: Story;
        message: string;
      }>("/stories", data);

      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to create story", {
        context: 'Creating story',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to create story"
      };
    }
  },

  /**
   * Update a story
   */
  async updateStory(id: string, data: UpdateStoryRequest): Promise<ApiResponse<Story>> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: Story;
        message: string;
      }>(`/stories/${id}`, data);

      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to update story", {
        context: 'Updating story',
        storyId: id,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to update story"
      };
    }
  },

  /**
   * Delete a story
   */
  async deleteStory(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/stories/${id}`);

      return {
        success: true,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to delete story", {
        context: 'Deleting story',
        storyId: id,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to delete story"
      };
    }
  },

  /**
   * Get tags for a story
   */
  async getStoryTags(storyId: string): Promise<ApiResponse<string[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { tags: string[] };
      }>(`/stories/${storyId}/tags`);

      return {
        success: true,
        data: response.data.tags
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch story tags", {
        context: 'Fetching story tags',
        storyId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch story tags"
      };
    }
  },

  /**
   * Add tags to a story
   */
  async addTagsToStory(storyId: string, tags: string[]): Promise<ApiResponse<string[]>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { tags: string[] };
        message: string;
      }>(`/stories/${storyId}/tags`, { tags });

      return {
        success: true,
        data: response.data.tags,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to add tags to story", {
        context: 'Adding tags to story',
        storyId,
        tags,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to add tags to story"
      };
    }
  },

  /**
   * Remove tags from a story
   */
  async removeTagsFromStory(storyId: string, tags: string[]): Promise<ApiResponse<string[]>> {
    try {
      // DELETE request with body is not standard, but some APIs support it.
      // If the API expects query params or a different method, adjust here.
      // Assuming the API supports sending tags in the body for DELETE or uses a specific endpoint.
      // Based on typical REST, maybe DELETE /stories/:id/tags with body?
      // Axios supports data in config for delete.
      const response = await apiClient.delete<{
        success: boolean;
        data: { tags: string[] };
        message: string;
      }>(`/stories/${storyId}/tags`, { data: { tags } });

      return {
        success: true,
        data: response.data.tags,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to remove tags from story", {
        context: 'Removing tags from story',
        storyId,
        tags,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to remove tags from story"
      };
    }
  },

  /**
   * Like a story
   */
  async likeStory(storyId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: any;
        message: string;
      }>(`/stories/${storyId}/like`);

      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to like story", {
        context: 'Liking story',
        storyId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to like story"
      };
    }
  },

  /**
   * Unlike a story
   */
  async unlikeStory(storyId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/stories/${storyId}/like`);

      return {
        success: true,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to unlike story", {
        context: 'Unliking story',
        storyId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to unlike story"
      };
    }
  },



  /**
   * Bookmark a story
   */
  async bookmarkStory(storyId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: any;
        message: string;
      }>(`/stories/${storyId}/bookmark`);

      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to bookmark story", {
        context: 'Bookmarking story',
        storyId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to bookmark story"
      };
    }
  },

  /**
   * Remove a bookmark
   */
  async removeBookmark(storyId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/stories/${storyId}/bookmark`);

      return {
        success: true,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to remove bookmark", {
        context: 'Removing bookmark',
        storyId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to remove bookmark"
      };
    }
  },

  /**
   * Get bookmarked stories for a user
   */
  async getBookmarkedStories(params?: {
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<ApiResponse<{ stories: StoryResponse[]; pagination: any }>> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const query = queryParams.toString();
      const url = query ? `/users/me/bookmarks?${query}` : '/users/me/bookmarks';

      const response = await apiClient.get<{
        success: boolean;
        data: StoryResponse[];
        meta: any;
      }>(url);

      return {
        success: true,
        data: {
          stories: response.data,
          pagination: response.meta
        }
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch bookmarked stories", {
        context: 'Fetching bookmarked stories',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch bookmarked stories"
      };
    }
  },

  /**
   * Follow a user
   */
  async followUser(username: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
      }>(`/users/${username}/follow`);

      return {
        success: true,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to follow user", {
        context: 'Following user',
        username,
        status: error.status,
        errorDetails: error
      });
      // For profile completion errors, throw the full error object
      if (error.status === 403 && error.code === 'PROFILE_INCOMPLETE') {
        return {
          success: false,
          message: error.message || "Profile incomplete"
        };
      }
      return {
        success: false,
        message: error.message || "Failed to follow user"
      };
    }
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(username: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/users/${username}/follow`);

      return {
        success: true,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to unfollow user", {
        context: 'Unfollowing user',
        username,
        status: error.status,
        errorDetails: error
      });
      // For profile completion errors, throw the full error object
      if (error.status === 403 && error.code === 'PROFILE_INCOMPLETE') {
        return {
          success: false,
          message: error.message || "Profile incomplete"
        };
      }
      return {
        success: false,
        message: error.message || "Failed to unfollow user"
      };
    }
  },

  /**
   * Check if the current user is following another user
   * This uses the user profile endpoint which includes follow status when authenticated
   */
  async isFollowingUser(username: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          id: string;
          name?: string;
          username: string;
          isFollowing: boolean;
          // ... other user data
        };
      }>(`/users/${username}`);

      return {
        success: true,
        data: response.data.isFollowing || false
      };
    } catch (error: any) {
      logError(error.message || "Failed to check follow status", {
        context: 'Checking follow status',
        username,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to check follow status",
        data: false
      };
    }
  },

  /**
   * Get followers for a user
   */
  async getFollowers(username: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ followers: any[]; pagination: any }>> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const query = queryParams.toString();
      const url = query ? `/users/${username}/followers?${query}` : `/users/${username}/followers`;

      const response = await apiClient.get<{
        success: boolean;
        data: any[];
        meta: any;
      }>(url);

      return {
        success: true,
        data: {
          followers: response.data,
          pagination: response.meta
        }
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch followers", {
        context: 'Fetching followers',
        username,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch followers"
      };
    }
  },

  /**
   * Get most viewed stories
   */
  async getMostViewedStories(params?: {
    limit?: number;
    timeRange?: string;
    page?: number;
  }): Promise<ApiResponse<{ stories: StoryResponse[]; pagination: any }>> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === 'timeRange') {
              queryParams.append(key, String(value));
            } else {
              queryParams.append(key, String(value));
            }
          }
        });
      }

      const query = queryParams.toString();
      const url = query ? `/stories/most-viewed?${query}` : '/stories/most-viewed';

      const response = await apiClient.get<{
        success: boolean;
        data: StoryResponse[];
        meta: any;
      }>(url);

      return {
        success: true,
        data: {
          stories: response.data,
          pagination: response.meta
        }
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch most viewed stories", {
        context: 'Fetching most viewed stories',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch most viewed stories"
      };
    }
  },

  /**
   * Get recommendations for a story
   */
  async getRecommendations(storyId: string, params?: {
    limit?: number;
    excludeSameAuthor?: boolean;
  }): Promise<ApiResponse<StoryRecommendation[]>> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const query = queryParams.toString();
      const url = query ? `/recommendations/${storyId}?${query}` : `/recommendations/${storyId}`;

      const response = await apiClient.get<StoryRecommendation[]>(url);

      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch story recommendations", {
        context: 'Fetching story recommendations',
        storyId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch story recommendations"
      };
    }
  },

  /**
   * Get users that a user is following
   */
  async getFollowing(username: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ following: any[]; pagination: any }>> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const query = queryParams.toString();
      const url = query ? `/users/${username}/following?${query}` : `/users/${username}/following`;

      const response = await apiClient.get<{
        success: boolean;
        data: any[];
        meta: any;
      }>(url);

      return {
        success: true,
        data: {
          following: response.data,
          pagination: response.meta
        }
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch following", {
        context: 'Fetching following',
        username,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch following"
      };
    }
  },

  /**
   * Check if a story is liked by the current user
   */
  async checkStoryLike(storyId: string): Promise<ApiResponse<boolean> & { likeCount?: number }> {
    try {
      const response = await apiClient.get<{
        isLiked: boolean;
        likeCount: number;
      }>(`/stories/${storyId}/like/check`);

      return {
        success: true,
        data: response.isLiked,
        likeCount: response.likeCount
      };
    } catch (error: any) {
      logError(error.message || "Failed to check story like status", {
        context: 'Checking story like status',
        storyId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to check story like status",
        data: false
      };
    }
  },

  /**
   * Check if a story is bookmarked by the current user
   */
  async checkStoryBookmark(storyId: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.get<{
        isBookmarked: boolean;
      }>(`/stories/${storyId}/bookmark/check`);

      return {
        success: true,
        data: response.isBookmarked
      };
    } catch (error: any) {
      logError(error.message || "Failed to check story bookmark status", {
        context: 'Checking story bookmark status',
        storyId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to check story bookmark status",
        data: false
      };
    }
  },
};
