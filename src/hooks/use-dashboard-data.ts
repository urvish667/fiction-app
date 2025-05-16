import { useState, useEffect } from 'react';
import { DashboardOverviewData, ApiResponse } from '@/types/dashboard';
import { logError } from '@/lib/error-logger';

/**
 * Custom hook for fetching dashboard data
 * @param timeRange The time range for the dashboard data
 * @returns Dashboard data, loading state, and error state
 */
export function useDashboardData(timeRange: string) {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Start loading
      setIsLoading(true);
      setError(null);

      try {
        // Fetch data from API
        const response = await fetch(`/api/dashboard/overview?timeRange=${timeRange}`);
        const result = await response.json() as ApiResponse<DashboardOverviewData>;

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch dashboard data');
        }

        setData(result.data);
      } catch (err) {
        logError(err, { context: 'Error fetching dashboard data' });
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return { data, isLoading, error };
}
