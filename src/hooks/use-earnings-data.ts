import { useState, useEffect } from 'react';
import { ApiResponse } from '@/types/dashboard';

/**
 * Custom hook for fetching earnings data
 * @param timeRange The time range for the earnings data
 * @returns Earnings data, loading state, and error state
 */
export function useEarningsData(timeRange: string) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard/earnings?timeRange=${timeRange}`);
        const result = await response.json() as ApiResponse<any>;

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch earnings data');
        }

        setData(result.data);
      } catch (err) {
        console.error('Error fetching earnings data:', err);
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
