import { useState, useEffect } from 'react';
import { ApiResponse } from '@/types/dashboard';
import { logError } from "@/lib/error-logger"

/**
 * Custom hook for fetching user stories
 * @returns User stories data, loading state, and error state
 */
export function useUserStories() {
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/dashboard/user-stories');
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
  }, []);

  return { data, isLoading, error };
}
