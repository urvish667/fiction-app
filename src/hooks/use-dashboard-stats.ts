import { useState, useEffect } from 'react';
import { DashboardStats, ApiResponse } from '@/types/dashboard';

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
        const response = await fetch(`/api/dashboard/stats?timeRange=${timeRange}`);
        const result = await response.json() as ApiResponse<DashboardStats>;

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch dashboard stats');
        }

        setData(result.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
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
