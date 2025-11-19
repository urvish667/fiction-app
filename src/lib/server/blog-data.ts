/**
 * Server-side data fetching utilities for blog page using API calls
 * This enables SSR for better SEO and Google indexing while using API layer
 */

import { BlogService } from "@/lib/api/blog";
import { BlogPost } from "@/types/blog";

/**
 * Fetch published blogs using API (server-side only for better architecture)
 * This function should only be called from Server Components
 */
export async function fetchPublishedBlogs(): Promise<BlogPost[]> {
  try {
    const response = await BlogService.getPublishedBlogs();

    if (!response.success || !response.data) {
      console.error("[Blog Data] API call failed:", response.message);
      return [];
    }

    return response.data;
  } catch (error) {
    console.error("[Blog Data] Error fetching published blogs:", error);
    if (error instanceof Error) {
      console.error("[Blog Data] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return [];
  }
}
