import { useState, useEffect } from 'react';
import { DashboardService } from '@/lib/api/dashboard';

/**
 * Custom hook for fetching user stories
 * @param timeRange The time range for filtering data
 * @returns User stories data, loading state, and error state
 */
export function useUserStories(timeRange: string = 'all') {
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await DashboardService.getCurrentUserStories({ timeRange });

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to fetch user stories');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return { data, isLoading, error };
}
