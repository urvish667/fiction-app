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
    publicProfile?: boolean;
    showEmail?: boolean;
    showLocation?: boolean;
    allowMessages?: boolean;
    forum?: boolean;
  };
}

export interface UserProfile {
  id: string;
  name?: string | null;
  username?: string;
  image?: string | null;
  preferences?: UserPreferences;
  donationsEnabled?: boolean | null;
  donationMethod?: string | null;
  donationLink?: string | null;
  bio?: string | null;
  location?: string | null;
  email?: string | null;
  website?: string | null;
  socialLinks?: {
    twitter?: string | null;
    facebook?: string | null;
    instagram?: string | null;
  } | null;
  bannerImage?: string | null;
  createdAt?: string;
  followers?: number;
  following?: number;
  storyCount?: number;
  joinedDate?: string;
}

export interface ProfileUpdateData {
  name?: string | null;
  username?: string;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  socialLinks?: {
    twitter?: string | null;
    facebook?: string | null;
    instagram?: string | null;
  } | null;
  language?: string | null;
  theme?: string | null;
  marketingOptIn?: boolean | null;
  image?: string | null;
  bannerImage?: string | null;
}

export interface DonationSettings {
  donationsEnabled: boolean;
  donationMethod: 'PAYPAL' | 'STRIPE' | 'BMC' | 'KOFI' | null;
  donationLink: string | null;
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

  /**
   * Get a user's bookmarks by userId (public access)
   * Used for displaying bookmarks on public profiles
   */
  async getUserBookmarksByUserId(userId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ stories: any[]; pagination: any }>> {
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
      const url = query ? `/users/${userId}/bookmarks?${query}` : `/users/${userId}/bookmarks`;

      const response = await apiClient.get<{
        success: boolean;
        data: any[];
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
      logError(error.message || "Failed to fetch user bookmarks", {
        context: 'Fetching user bookmarks by userId',
        userId,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch user bookmarks"
      };
    }
  },

  /**
   * Get current user's donation settings
   */
  async getDonationSettings(): Promise<ApiResponse<DonationSettings>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: DonationSettings;
      }>('/users/me/donation-settings');

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to fetch donation settings", {
        context: 'Fetching donation settings',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch donation settings"
      };
    }
  },

  /**
   * Update current user's donation settings
   */
  async updateDonationSettings(settings: Partial<DonationSettings>): Promise<ApiResponse<DonationSettings>> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: DonationSettings;
        message: string;
      }>('/users/me/donation-settings', settings);

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to update donation settings", {
        context: 'Updating donation settings',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to update donation settings"
      };
    }
  },

  /**
   * Enable donations for current user
   */
  async enableDonations(method: 'PAYPAL' | 'STRIPE' | 'BMC' | 'KOFI', link?: string): Promise<ApiResponse<DonationSettings>> {
    try {
      const payload: { method: string; link?: string } = { method };
      if (method === 'PAYPAL' || method === 'BMC' || method === 'KOFI') {
        payload.link = link;
      }

      const response = await apiClient.post<{
        success: boolean;
        data: DonationSettings;
        message: string;
      }>('/users/me/enable-donations', payload);

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to enable donations", {
        context: 'Enabling donations',
        method,
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to enable donations"
      };
    }
  },

  /**
   * Disable donations for current user
   */
  async disableDonations(): Promise<ApiResponse<DonationSettings>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: DonationSettings;
        message: string;
      }>('/users/me/disable-donations');

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to disable donations", {
        context: 'Disabling donations',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to disable donations"
      };
    }
  },

  /**
   * Get current user's profile
   */
  async getCurrentUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: UserProfile;
      }>('/users/me');

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to fetch current user profile", {
        context: 'Fetching current user profile',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch current user profile"
      };
    }
  },

  /**
   * Update current user's profile
   */
  async updateCurrentUserProfile(profileData: ProfileUpdateData): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: UserProfile;
        message: string;
      }>('/users/me', profileData);

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to update user profile", {
        context: 'Updating user profile',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to update user profile"
      };
    }
  },

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<ApiResponse<UserPreferences>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: UserPreferences;
      }>('/users/me/preferences');

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to fetch user preferences", {
        context: 'Fetching user preferences',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch user preferences"
      };
    }
  },

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences: UserPreferences): Promise<ApiResponse<UserPreferences>> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: UserPreferences;
        message: string;
      }>('/users/me/preferences', preferences);

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to update user preferences", {
        context: 'Updating user preferences',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to update user preferences"
      };
    }
  },

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
      }>('/users/me/change-password', { currentPassword, newPassword, confirmPassword });

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to change password", {
        context: 'Changing password',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to change password"
      };
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount(password?: string): Promise<ApiResponse<void>> {
    try {
      const payload = password ? { confirmation: true, password } : { confirmation: true };
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>('/users/me', { data: payload });

      return response;
    } catch (error: any) {
      logError(error.message || "Failed to delete account", {
        context: 'Deleting account',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to delete account"
      };
    }
  },
};
