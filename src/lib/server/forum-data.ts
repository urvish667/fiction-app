/**
 * Server-side data fetching utilities for forum page
 * This enables SSR for better SEO by calling backend APIs server-side
 * Uses UserService and authentication APIs instead of direct database access
 */

import { cookies } from 'next/headers';
import { UserService } from '@/lib/api/user';

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
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access-token')?.value;

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
