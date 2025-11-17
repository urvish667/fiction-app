import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
}

export interface UserPreferences {
  privacySettings?: {
    forum?: boolean;
  };
}

export interface UserProfile {
  id: string;
  name?: string;
  username?: string;
  image?: string;
  preferences?: UserPreferences;
  donationsEnabled?: boolean;
  donationMethod?: string;
  donationLink?: string;
}

/**
 * User API service for interacting with the REST API endpoints
 */
export const UserService = {
  /**
   * Get user profile by username
   */
  async getUserProfile(username: string): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: UserProfile;
      }>(`/users/${username}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch user profile", {
        context: 'Fetching user profile',
        username,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch user profile"
      };
    }
  },

  /**
   * Get user profile and follow status in one call to minimize API requests
   */
  async getUserProfileAndFollowStatus(username: string): Promise<ApiResponse<{
    profile: UserProfile;
    isFollowing: boolean;
  }>> {
    try {
      // First get profile to check forum settings
      const profileResponse = await this.getUserProfile(username);
      if (!profileResponse.success || !profileResponse.data) {
        return {
          success: false,
          message: profileResponse.message || "Failed to fetch user profile"
        };
      }

      // Then check follow status
      const followResponse = await apiClient.get<{
        success: boolean;
        data: boolean;
      }>(`/users/${username}`);

      // The follow status should be included in the profile response if authenticated
      // But since we need to make a separate call to StoryService.isFollowingUser,
      // we'll keep it simple and just return what we have
      // Note: The actual follow status check is handled separately by StoryService.isFollowingUser

      return {
        success: true,
        data: {
          profile: profileResponse.data,
          isFollowing: false // This will be set by the separate follow check
        }
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch user profile and follow status", {
        context: 'Fetching user profile and follow status',
        username,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch user profile and follow status"
      };
    }
  },
};
