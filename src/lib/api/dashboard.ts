import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";

/**
 * Dashboard API service for interacting with dashboard REST API endpoints
 */

// Types for dashboard responses
interface AuthorDashboardData {
  stats: {
    totalStories: number;
    totalChapters: number;
    totalViews: number;
    totalLikes: number;
    totalFollowers: number;
    newStories: number;
    newChapters: number;
  };
  recentStories: Array<any>;
  draftStories: Array<any>;
  topPerformingStories: Array<any>;
  recentComments: Array<any>;
  timeframe: string;
}

interface AuthorStatsData {
  totalReads: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  totalEarnings: number;
  readsChange: number;
  likesChange: number;
  commentsChange: number;
  followersChange: number;
  earningsChange: number;
}

interface ChartDataPoint {
  name: string;
  reads?: number;
  likes?: number;
  comments?: number;
  earnings?: number;
}

interface EarningsData {
  totalEarnings: number;
  thisMonthEarnings: number;
  monthlyChange: number;
  stories: Array<{
    id: string;
    title: string;
    earnings: number;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    donorUsername: string;
    donorName: string;
    storyTitle: string;
    createdAt: string;
    message?: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Dashboard API service
 */
export const DashboardService = {
  /**
   * Get author dashboard data
   */
  async getAuthorDashboard(params?: {
    timeRange?: string;
    draft?: boolean;
  }): Promise<ApiResponse<AuthorDashboardData>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.timeRange) queryParams.append('timeRange', params.timeRange);
      if (params?.draft !== undefined) queryParams.append('draft', params.draft.toString());

      const query = queryParams.toString();
      const url = query ? `/dashboard/author?${query}` : '/dashboard/author';

      const response = await apiClient.get<{
        success: boolean;
        data: AuthorDashboardData;
      }>(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch author dashboard", {
        context: 'Fetching author dashboard',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch author dashboard"
      };
    }
  },

  /**
   * Get author stats (in case there's a separate endpoint)
   */
  async getAuthorStats(params?: {
    timeRange?: string;
  }): Promise<ApiResponse<AuthorStatsData>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.timeRange) queryParams.append('timeRange', params.timeRange);

      const query = queryParams.toString();
      const url = query ? `/dashboard/author/stats?${query}` : '/dashboard/author/stats';

      const response = await apiClient.get<{
        success: boolean;
        data: AuthorStatsData;
      }>(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch author stats", {
        context: 'Fetching author stats',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch author stats"
      };
    }
  },

  /**
   * Get top performing stories for author
   */
  async getTopStories(params?: {
    limit?: number;
    sortBy?: string;
    timeRange?: string;
  }): Promise<ApiResponse<Array<{
    id: string;
    title: string;
    genreName?: string;
    slug: string;
    reads: number;
    likes: number;
    comments: number;
    earnings: number;
  }>>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.timeRange) queryParams.append('timeRange', params.timeRange);

      const query = queryParams.toString();
      const url = query ? `/dashboard/author/top-stories?${query}` : '/dashboard/author/top-stories';

      const response = await apiClient.get<{
        success: boolean;
        data: Array<{
          id: string;
          title: string;
          genreName?: string;
          slug: string;
          reads: number;
          likes: number;
          comments: number;
          earnings: number;
        }>;
      }>(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch top stories", {
        context: 'Fetching top stories',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch top stories"
      };
    }
  },

  /**
   * Get reads chart data
   */
  async getReadsChart(params?: {
    timeRange?: string;
  }): Promise<ApiResponse<ChartDataPoint[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.timeRange) queryParams.append('timeRange', params.timeRange);

      const query = queryParams.toString();
      const url = query ? `/dashboard/author/charts/reads?${query}` : '/dashboard/author/charts/reads';

      const response = await apiClient.get<{
        success: boolean;
        data: ChartDataPoint[];
      }>(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch reads chart", {
        context: 'Fetching reads chart',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch reads chart"
      };
    }
  },

  /**
   * Get engagement chart data
   */
  async getEngagementChart(params?: {
    timeRange?: string;
  }): Promise<ApiResponse<ChartDataPoint[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.timeRange) queryParams.append('timeRange', params.timeRange);

      const query = queryParams.toString();
      const url = query ? `/dashboard/author/charts/engagement?${query}` : '/dashboard/author/charts/engagement';

      const response = await apiClient.get<{
        success: boolean;
        data: ChartDataPoint[];
      }>(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch engagement chart", {
        context: 'Fetching engagement chart',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch engagement chart"
      };
    }
  },

  /**
   * Get earnings chart data
   */
  async getEarningsChart(params?: {
    timeRange?: string;
  }): Promise<ApiResponse<ChartDataPoint[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.timeRange) queryParams.append('timeRange', params.timeRange);

      const query = queryParams.toString();
      const url = query ? `/dashboard/author/charts/earnings?${query}` : '/dashboard/author/charts/earnings';

      const response = await apiClient.get<{
        success: boolean;
        data: ChartDataPoint[];
      }>(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch earnings chart", {
        context: 'Fetching earnings chart',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch earnings chart"
      };
    }
  },

  /**
   * Get author earnings data
   */
  async getAuthorEarnings(params?: {
    timeRange?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<EarningsData>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.timeRange) queryParams.append('timeRange', params.timeRange);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

      const query = queryParams.toString();
      const url = query ? `/dashboard/author/earnings?${query}` : '/dashboard/author/earnings';

      const response = await apiClient.get<{
        success: boolean;
        data: EarningsData;
      }>(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch author earnings", {
        context: 'Fetching author earnings',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch author earnings"
      };
    }
  },

  /**
   * Get current user's stories
   */
  async getCurrentUserStories(params?: {
    timeRange?: string;
  }): Promise<ApiResponse<Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    genreName: string;
    reads: number;
    likes: number;
    comments: number;
    updatedAt: string;
  }>>> {
    try {
      // Since there's no direct backend API for current user stories,
      // we'll use the dashboard author overview which includes recent stories
      const result = await this.getAuthorDashboard(params);

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch current user stories');
      }

      // The backend returns recentStories, but for dashboard stories tab,
      // we need all user stories. Since this endpoint doesn't provide that,
      // this is a limitation. For now, return recentStories as placeholder.
      const stories = result.data.recentStories.map(story => ({
        id: story.id,
        title: story.title,
        slug: story.slug,
        status: story.status || 'unknown',
        genreName: 'General', // Backend doesn't provide genre here
        reads: story.readCount || 0,
        likes: story._count?.likes || 0,
        comments: story._count?.comments || 0,
        updatedAt: story.updatedAt,
      }));

      return {
        success: true,
        data: stories
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch current user stories", {
        context: 'Fetching current user stories',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch current user stories"
      };
    }
  },
};
