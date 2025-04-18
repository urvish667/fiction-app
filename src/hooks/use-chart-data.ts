import { useState, useEffect } from 'react';
import { ReadsDataPoint, EngagementDataPoint, EarningsDataPoint, ApiResponse } from '@/types/dashboard';

/**
 * Custom hook for fetching reads chart data
 * @param timeRange The time range for the chart data
 * @returns Reads chart data, loading state, and error state
 */
export function useReadsChartData(timeRange: string) {
  const [data, setData] = useState<ReadsDataPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard/charts/reads?timeRange=${timeRange}`);
        const result = await response.json() as ApiResponse<ReadsDataPoint[]>;

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch reads chart data');
        }

        setData(result.data);
      } catch (err) {
        console.error('Error fetching reads chart data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');

        // Fallback to empty array to prevent UI errors
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return { data, isLoading, error };
}

/**
 * Custom hook for fetching engagement chart data
 * @param timeRange The time range for the chart data
 * @returns Engagement chart data, loading state, and error state
 */
export function useEngagementChartData(timeRange: string) {
  const [data, setData] = useState<EngagementDataPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard/charts/engagement?timeRange=${timeRange}`);
        const result = await response.json() as ApiResponse<EngagementDataPoint[]>;

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch engagement chart data');
        }

        setData(result.data);
      } catch (err) {
        console.error('Error fetching engagement chart data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');

        // Fallback to empty array to prevent UI errors
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return { data, isLoading, error };
}

/**
 * Custom hook for fetching earnings chart data
 * @param timeRange The time range for the chart data
 * @returns Earnings chart data, loading state, and error state
 */
export function useEarningsChartData(timeRange: string) {
  const [data, setData] = useState<EarningsDataPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard/charts/earnings?timeRange=${timeRange}`);
        const result = await response.json() as ApiResponse<EarningsDataPoint[]>;

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch earnings chart data');
        }

        setData(result.data);
      } catch (err) {
        console.error('Error fetching earnings chart data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');

        // Fallback to empty array to prevent UI errors
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return { data, isLoading, error };
}
