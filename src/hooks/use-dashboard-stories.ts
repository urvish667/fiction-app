import { useState, useEffect } from 'react';
import { DashboardStory, ApiResponse } from '@/types/dashboard';

/**
 * Custom hook for fetching top performing stories
 * @param limit Number of stories to fetch
 * @param sortBy Field to sort by (reads, likes, comments, earnings)
 * @returns Stories data, loading state, and error state
 */
export function useDashboardStories(limit: number = 5, sortBy: string = 'reads') {
  const [data, setData] = useState<DashboardStory[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard/stories?limit=${limit}&sortBy=${sortBy}`);
        const result = await response.json() as ApiResponse<DashboardStory[]>;

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch stories');
        }

        setData(result.data);
      } catch (err) {
        console.error('Error fetching stories:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');

        // Fallback to empty array to prevent UI errors
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [limit, sortBy]);

  return { data, isLoading, error };
}
