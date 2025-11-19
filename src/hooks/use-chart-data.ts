import { useState, useEffect } from 'react';
import { ReadsDataPoint, EngagementDataPoint, EarningsDataPoint } from '@/types/dashboard';
import { DashboardService } from '@/lib/api/dashboard';

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
        const result = await DashboardService.getReadsChart({ timeRange });

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to fetch reads chart data');
        }

        // Transform to expected format
        const transformedData = (result.data || []).map(point => ({
          name: point.name || '',
          reads: point.reads || 0,
        }));

        setData(transformedData);
      } catch (err) {
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
        const result = await DashboardService.getEngagementChart({ timeRange });

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to fetch engagement chart data');
        }

        // Transform to expected format
        const transformedData = (result.data || []).map(point => ({
          name: point.name || '',
          likes: point.likes || 0,
          comments: point.comments || 0,
        }));

        setData(transformedData);
      } catch (err) {
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
        const result = await DashboardService.getEarningsChart({ timeRange });

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to fetch earnings chart data');
        }

        // Transform to expected format
        const transformedData = (result.data || []).map(point => ({
          name: point.name || '',
          earnings: point.earnings || 0,
        }));

        setData(transformedData);
      } catch (err) {
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
