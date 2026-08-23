/**
 * Server-side data fetching utilities for forum page
 * This enables SSR for better SEO by calling backend APIs server-side
 * Uses UserService and authentication APIs instead of direct database access
 */

import { UserService } from '@/lib/api/user';
import { ForumService } from '@/lib/api/forum';

export interface ServerForumData {
  user: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  forum: {
    id: string;
    createdAt: string;
  } | null;
  isOwner: boolean;
  currentUserId: string | null;
}

/**
 * Fetch forum data server-side including current user authentication
 * This function should only be called from Server Components
 * Uses API calls instead of direct database access like the browse page
 */
export async function fetchForumData(username: string): Promise<ServerForumData | null> {
  try {
    // Get current user from JWT cookies (server-side)
    let accessToken: string | undefined;
    if (typeof window === 'undefined') {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      accessToken = cookieStore.get('fablespace_access_token')?.value;
    }

    // Try to get current user from API using direct fetch
    let currentUser = null;
    if (accessToken) {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.fablespace.com/api/v1';
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.user) {
            currentUser = data.data.user;
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    }

    // Get user profile from API instead of direct database access
    const userProfileResponse = await UserService.getUserProfile(username);

    if (!userProfileResponse.success || !userProfileResponse.data) {
      return null;
    }

    const userProfile = userProfileResponse.data;

    // Check if forum is enabled in user preferences
    const forumEnabled = userProfile.preferences?.privacySettings?.forum === true;

    if (!forumEnabled) {
      return null;
    }

    // Check if current user is the forum owner
    const isOwner = currentUser ? currentUser.id === userProfile.id : false;

    // For now, we'll set forum data to null since we're not fetching forum metadata from API yet
    // This can be enhanced later to fetch forum data from a forum API endpoint
    const forum = null;

    return {
      user: {
        id: userProfile.id,
        name: userProfile.name ?? null,
        username: userProfile.username ?? username,
        image: userProfile.image ?? null,
      },
      forum,
      isOwner,
      currentUserId: currentUser?.id || null,
    };
  } catch (error) {
    console.error('Error fetching forum data:', error);
    return null;
  }
}

/**
 * Fetch forum single post data server-side
 */
export async function getForumPostData(username: string, slug: string) {
  try {
    // Get user profile from API
    const userProfileResponse = await UserService.getUserProfile(username);

    if (!userProfileResponse.success || !userProfileResponse.data) {
      return null;
    }

    const userProfile = userProfileResponse.data;

    // Check if forum is enabled
    if (!userProfile.preferences?.privacySettings?.forum) {
      return null;
    }

    // Get all posts to find the one with matching slug
    const postsResponse = await ForumService.getPosts(username, { limit: 100 });

    if (!postsResponse.success || !postsResponse.data) {
      return null;
    }

    // Find the post with matching slug
    const postData = postsResponse.data.posts.find(p => p.slug === slug);
    if (!postData) {
      return null;
    }

    // Use the getPost API method to get full post details
    const singlePostResponse = await ForumService.getPost(username, postData.id);

    let finalPostData;
    if (singlePostResponse.success && singlePostResponse.data) {
      finalPostData = singlePostResponse.data;
    } else {
      // Fallback to the data we already have from posts list
      finalPostData = postData;
    }

    // Get comments for the post
    const commentsResponse = await ForumService.getComments(username, postData.id);

    let comments: any[] = [];
    if (commentsResponse.success && commentsResponse.data) {
      comments = commentsResponse.data.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: new Date(comment.createdAt),
        editedAt: comment.editedAt ? new Date(comment.editedAt) : null,
        author: {
          id: comment.user.id,
          name: comment.user.name || comment.user.username || 'Unknown',
          username: comment.user.username || 'unknown',
          image: comment.user.image
        }
      }));
    }

    // Transform post to match expected format
    const transformedPost = {
      id: finalPostData.id,
      title: finalPostData.title,
      slug: finalPostData.slug,
      content: finalPostData.content,
      pinned: finalPostData.pinned,
      createdAt: new Date(finalPostData.createdAt),
      commentCount: comments.length,
      comments: comments,
      author: {
        id: finalPostData.author.id,
        name: finalPostData.author.name || finalPostData.author.username || 'Unknown',
        username: finalPostData.author.username || 'unknown',
        image: finalPostData.author.image
      }
    };

    return {
      post: transformedPost,
      user: {
        id: userProfile.id,
        name: userProfile.name ?? userProfile.username ?? 'Unknown',
        username: userProfile.username ?? 'unknown',
        image: userProfile.image
      }
    };
  } catch (error) {
    console.error('Error fetching post data:', error);
    return null;
  }
}
