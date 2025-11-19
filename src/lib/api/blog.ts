import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";
import type { BlogPost } from "@/types/blog";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
}

/**
 * Blog API service for interacting with the REST API endpoints
 */
export const BlogService = {
  /**
   * Get all published blogs
   */
  async getPublishedBlogs(): Promise<ApiResponse<BlogPost[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: BlogPost[];
      }>("/blogs");

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch published blogs", {
        context: 'Fetching published blogs',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch published blogs"
      };
    }
  },

  /**
   * Get a blog by slug
   */
  async getBlogBySlug(slug: string): Promise<ApiResponse<BlogPost | null>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: BlogPost;
      }>(`/blogs/${slug}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      // If blog not found, return null instead of error
      if (error.status === 404) {
        return {
          success: true,
          data: null
        };
      }

      logError(error.message || "Failed to fetch blog by slug", {
        context: 'Fetching blog by slug',
        slug,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch blog by slug"
      };
    }
  },
};
