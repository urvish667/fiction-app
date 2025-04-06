import { Comment } from "@/types/story";

/**
 * Service for interacting with the comment API endpoints
 */
export const CommentService = {
  /**
   * Get comments for a story
   */
  async getComments(storyId: string, params?: {
    page?: number;
    limit?: number;
    parentId?: string | null;
  }): Promise<{ comments: Comment[]; pagination: any }> {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`/api/stories/${storyId}/comments?${queryParams.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch comments");
    }
    
    return response.json();
  },

  /**
   * Get a specific comment
   */
  async getComment(commentId: string): Promise<Comment> {
    const response = await fetch(`/api/comments/${commentId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch comment");
    }
    
    return response.json();
  },

  /**
   * Create a new comment
   */
  async createComment(storyId: string, data: { content: string; parentId?: string }): Promise<Comment> {
    const response = await fetch(`/api/stories/${storyId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create comment");
    }
    
    return response.json();
  },

  /**
   * Update a comment
   */
  async updateComment(commentId: string, data: { content: string }): Promise<Comment> {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update comment");
    }
    
    return response.json();
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete comment");
    }
  },

  /**
   * Get replies for a comment
   */
  async getReplies(commentId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ replies: Comment[]; pagination: any }> {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`/api/comments/${commentId}/replies?${queryParams.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch replies");
    }
    
    return response.json();
  },
};
