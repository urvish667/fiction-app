import { useState, useEffect } from 'react';
import { ApiResponse } from '@/types/dashboard';
import { logError } from "@/lib/error-logger"

/**
 * Custom hook for fetching user stories
 * @param timeRange The time range for filtering data
 * @param sortBy The field to sort the stories by
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
        const response = await fetch(`/api/dashboard/user-stories?timeRange=${timeRange}`);
        const result = await response.json() as ApiResponse<any[]>;

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch user stories');
        }

        setData(result.data);
      } catch (err) {
        logError(err, { context: 'Error fetching user stories' });
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
