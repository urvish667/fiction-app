import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  pinned: boolean;
  pinnedOrder?: number | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    image: string | null;
  };
  _count: {
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
  user: {
    id: string;
    username: string;
    name: string;
    image: string | null;
  };
  parent?: Comment | null;
  _count?: {
    replies: number;
  };
  editedAt?: string | null;
}

export interface BannedUser {
  forumId: string;
  userId: string;
  reason?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    image: string | null;
    email: string;
  };
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Forum API service for interacting with the REST API endpoints
 */
export const ForumService = {
  /**
   * Get all posts for a forum
   */
  async getPosts(username: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PostsResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const query = queryParams.toString();
      const url = query ? `/forum/${username}/posts?${query}` : `/forum/${username}/posts`;

      const response = await apiClient.get<{
        success: boolean;
        data: PostsResponse;
      }>(url);

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to fetch posts", {
        context: 'Fetching forum posts',
        username,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch posts"
      };
    }
  },

  /**
   * Get a single post by ID
   */
  async getPost(username: string, postId: string): Promise<ApiResponse<Post>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Post;
      }>(`/forum/${username}/posts/${postId}`);

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to fetch post", {
        context: 'Fetching forum post',
        username,
        postId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch post"
      };
    }
  },

  /**
   * Create a new forum post
   */
  async createPost(username: string, data: {
    title: string;
    content: string;
    contentKey?: string;
  }): Promise<ApiResponse<Post>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: Post;
        message: string;
      }>(`/forum/${username}/posts`, data);

      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to create post", {
        context: 'Creating forum post',
        username,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to create post"
      };
    }
  },

  /**
   * Update a forum post
   */
  async updatePost(username: string, postId: string, data: {
    title?: string;
    content?: string;
    contentKey?: string;
  }): Promise<ApiResponse<Post>> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: Post;
        message: string;
      }>(`/forum/${username}/posts/${postId}`, data);

      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to update post", {
        context: 'Updating forum post',
        username,
        postId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to update post"
      };
    }
  },

  /**
   * Delete a forum post
   */
  async deletePost(username: string, postId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/forum/${username}/posts/${postId}`);

      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to delete post", {
        context: 'Deleting forum post',
        username,
        postId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to delete post"
      };
    }
  },

  /**
   * Toggle post pinned status
   */
  async togglePin(username: string, postId: string, pinned: boolean): Promise<ApiResponse<Post>> {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: Post;
        message: string;
      }>(`/forum/${username}/posts/${postId}`, {
        pinned: pinned
      });

      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to toggle post pin", {
        context: 'Toggling post pin',
        username,
        postId,
        pinned,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to toggle post pin"
      };
    }
  },

  /**
   * Get comments for a post
   */
  async getComments(username: string, postId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<CommentsResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const query = queryParams.toString();
      const url = query ? `/forum/${username}/posts/${postId}/comments?${query}` : `/forum/${username}/posts/${postId}/comments`;

      const response = await apiClient.get<{
        success: boolean;
        data: CommentsResponse;
      }>(url);

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to fetch comments", {
        context: 'Fetching post comments',
        username,
        postId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch comments"
      };
    }
  },

  /**
   * Create a new comment on a post
   */
  async createComment(username: string, postId: string, data: {
    content: string;
    parentId?: string;
  }): Promise<ApiResponse<Comment>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: Comment;
      }>(`/forum/${username}/posts/${postId}/comments`, data);

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to create comment", {
        context: 'Creating forum comment',
        username,
        postId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to create comment"
      };
    }
  },

  /**
   * Update a comment
   */
  async updateComment(username: string, postId: string, commentId: string, data: {
    content: string;
  }): Promise<ApiResponse<Comment>> {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: Comment;
      }>(`/forum/${username}/posts/${postId}/comments/${commentId}`, data);

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to update comment", {
        context: 'Updating forum comment',
        username,
        postId,
        commentId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to update comment"
      };
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(username: string, postId: string, commentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/forum/${username}/posts/${postId}/comments/${commentId}`);

      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to delete comment", {
        context: 'Deleting forum comment',
        username,
        postId,
        commentId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to delete comment"
      };
    }
  },

  /**
   * Ban a user from a forum
   */
  async banUser(username: string, userId: string, reason?: string): Promise<ApiResponse<{
    forumId: string;
    userId: string;
    reason?: string;
    createdAt: string;
  }>> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: {
          forumId: string;
          userId: string;
          reason?: string;
          createdAt: string;
        };
      }>(`/forum/${username}/ban/${userId}`, reason ? { reason } : {});

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to ban user", {
        context: 'Banning forum user',
        username,
        userId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to ban user"
      };
    }
  },

  /**
   * Unban a user from a forum
   */
  async unbanUser(username: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/forum/${username}/ban/${userId}`);

      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to unban user", {
        context: 'Unbanning forum user',
        username,
        userId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to unban user"
      };
    }
  },

  /**
   * Get banned users for a forum
   */
  async getBannedUsers(username: string): Promise<ApiResponse<BannedUser[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: BannedUser[];
      }>(`/forum/${username}/banned-users`);

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to fetch banned users", {
        context: 'Fetching banned forum users',
        username,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch banned users"
      };
    }
  },
};
