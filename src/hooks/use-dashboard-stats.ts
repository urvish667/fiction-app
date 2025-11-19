import { useState, useEffect } from 'react';
import { DashboardStats } from '@/types/dashboard';
import { DashboardService } from '@/lib/api/dashboard';

/**
 * Custom hook for fetching dashboard statistics
 * @param timeRange The time range for the dashboard data
 * @returns Dashboard stats, loading state, and error state
 */
export function useDashboardStats(timeRange: string) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await DashboardService.getAuthorStats({ timeRange });

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to fetch dashboard stats');
        }

        // Transform backend data to frontend format
        const backendData = result.data; // The backend returns stats directly
        setData({
          totalReads: backendData.totalReads || 0,
          totalLikes: backendData.totalLikes || 0,
          totalComments: backendData.totalComments || 0,
          totalFollowers: backendData.totalFollowers || 0,
          totalEarnings: backendData.totalEarnings || 0,
          readsChange: backendData.readsChange || 0,
          likesChange: backendData.likesChange || 0,
          commentsChange: backendData.commentsChange || 0,
          followersChange: backendData.followersChange || 0,
          earningsChange: backendData.earningsChange || 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');

        // Create default stats to prevent UI errors
        setData({
          totalReads: 0,
          totalLikes: 0,
          totalComments: 0,
          totalFollowers: 0,
          totalEarnings: 0,
          readsChange: 0,
          likesChange: 0,
          commentsChange: 0,
          followersChange: 0,
          earningsChange: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return { data, isLoading, error };
}
