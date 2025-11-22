import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";
import type { Comment } from "@/types/story";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: any;
}

export interface RepliesResponse {
  replies: Comment[];
  pagination: any;
}

/**
 * Comment API service for interacting with the REST API endpoints
 */
export const CommentService = {
  /**
   * Get comments for a story
   */
  async getComments(storyId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'oldest' | 'likes';
    parentId?: string | null;
  }): Promise<ApiResponse<CommentsResponse>> {
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
      const url = query ? `/comments/story/${storyId}?${query}` : `/comments/story/${storyId}`;

      const response = await apiClient.get<{
        success: boolean;
        data: Comment[];
        pagination: any;
      }>(url);

      return {
        success: true,
        data: {
          comments: response.data,
          pagination: response.pagination
        }
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch comments", {
        context: 'Fetching comments',
        storyId,
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
   * Get comments for a chapter
   */
  async getChapterComments(chapterId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'oldest' | 'likes';
    parentId?: string | null;
  }): Promise<ApiResponse<CommentsResponse>> {
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
      const url = query ? `/comments/chapter/${chapterId}?${query}` : `/comments/chapter/${chapterId}`;

      const response = await apiClient.get<{
        success: boolean;
        data: Comment[];
        pagination: any;
      }>(url);

      return {
        success: true,
        data: {
          comments: response.data,
          pagination: response.pagination
        }
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch chapter comments", {
        context: 'Fetching chapter comments',
        chapterId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch chapter comments"
      };
    }
  },

  /**
   * Get a specific comment
   */
  async getComment(commentId: string): Promise<ApiResponse<Comment>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Comment;
      }>(`/comments/${commentId}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch comment", {
        context: 'Fetching comment',
        commentId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch comment"
      };
    }
  },

  /**
   * Create a new comment
   */
  async createComment(storyId: string, data: { content: string; parentId?: string }): Promise<ApiResponse<Comment>> {
    try {
      const requestBody = {
        ...data,
        storyId
      };

      const response = await apiClient.post<{
        success: boolean;
        data: Comment;
      }>(`/comments`, requestBody);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to create comment", {
        context: 'Creating comment',
        storyId,
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
   * Create a new chapter comment
   */
  async createChapterComment(chapterId: string, storyId: string, data: { content: string; parentId?: string }): Promise<ApiResponse<Comment>> {
    try {
      const requestBody = {
        ...data,
        chapterId,
        storyId
      };

      const response = await apiClient.post<{
        success: boolean;
        data: Comment;
      }>(`/comments`, requestBody);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to create chapter comment", {
        context: 'Creating chapter comment',
        chapterId,
        storyId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to create chapter comment"
      };
    }
  },

  /**
   * Update a comment
   */
  async updateComment(commentId: string, data: { content: string }): Promise<ApiResponse<Comment>> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: Comment;
        message: string;
      }>(`/comments/${commentId}`, data);

      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to update comment", {
        context: 'Updating comment',
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
  async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/comments/${commentId}`);

      return {
        success: true,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to delete comment", {
        context: 'Deleting comment',
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
   * Get replies for a comment (optimized - assumes we know the context)
   */
  async getReplies(parentId: string, context: { storyId: string; chapterId?: string }, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<RepliesResponse>> {
    try {
      // Use the appropriate method based on the provided context
      let commentsResponse;
      if (context.chapterId) {
        // It's a chapter comment, get replies from the chapter
        commentsResponse = await this.getChapterComments(context.chapterId, {
          ...params,
          parentId: parentId
        });
      } else {
        // It's a story comment, get replies from the story
        commentsResponse = await this.getComments(context.storyId, {
          ...params,
          parentId: parentId
        });
      }

      return {
        success: true,
        data: {
          replies: commentsResponse.data?.comments || [],
          pagination: commentsResponse.data?.pagination
        }
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch replies", {
        context: 'Fetching replies',
        parentId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch replies"
      };
    }
  },



  /**
   * Like a comment
   */
  async likeComment(commentId: string): Promise<ApiResponse<{ likeCount: number }>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { likeCount: number };
      }>(`/comments/${commentId}/like`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to like comment", {
        context: 'Liking comment',
        commentId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to like comment"
      };
    }
  },

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string): Promise<ApiResponse<{ likeCount: number }>> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        data: { likeCount: number };
        message: string;
      }>(`/comments/${commentId}/like`);

      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      logError(error.message || "Failed to unlike comment", {
        context: 'Unliking comment',
        commentId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to unlike comment"
      };
    }
  },
};
