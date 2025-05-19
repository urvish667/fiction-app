import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, DonationTransaction, PaginationInfo } from '@/types/dashboard';
import { logError } from '@/lib/error-logger';

// Define the transformed data structure that matches what the component expects
interface TransformedEarningsData {
  totalEarnings: number;
  thisMonthEarnings: number;
  monthlyChange: number;
  stories: Array<{
    id: string;
    title: string;
    genre: string;
    genreName?: string;
    slug?: string;
    reads: number;
    earnings: number;
  }>;
  transactions: DonationTransaction[];
  pagination: PaginationInfo;
  chartData: Array<{
    name: string;
    earnings: number;
  }>;
}

/**
 * Custom hook for fetching earnings data
 * @param timeRange The time range for the earnings data
 * @returns Earnings data, loading state, error state, and functions to load more data
 */
export function useEarningsData(timeRange: string) {
  const [data, setData] = useState<TransformedEarningsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch initial data
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch earnings data with page 1
      const earningsResponse = await fetch(`/api/dashboard/earnings?timeRange=${timeRange}&page=1&pageSize=10`);
      const earningsResult = await earningsResponse.json() as ApiResponse<any>;

      if (!earningsResult.success || !earningsResult.data) {
        throw new Error(earningsResult.error || 'Failed to fetch earnings data');
      }

      // Fetch earnings chart data
      const chartResponse = await fetch(`/api/dashboard/charts/earnings?timeRange=${timeRange}`);
      const chartResult = await chartResponse.json() as ApiResponse<Array<{name: string, earnings: number}>>;

      if (!chartResult.success || !chartResult.data) {
        throw new Error(chartResult.error || 'Failed to fetch earnings chart data');
      }

      // Use the data directly from the API
      const transformedData: TransformedEarningsData = {
        totalEarnings: earningsResult.data.totalEarnings,
        thisMonthEarnings: earningsResult.data.thisMonthEarnings,
        monthlyChange: earningsResult.data.monthlyChange,
        stories: earningsResult.data.stories || [],
        transactions: earningsResult.data.transactions || [],
        pagination: earningsResult.data.pagination,
        chartData: chartResult.data,
      };

      setData(transformedData);
    } catch (err) {
      logError(err, { context: 'Error fetching earnings data' });
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // Function to load more transactions
  const loadMoreTransactions = useCallback(async () => {
    if (!data || !data.pagination || isLoadingMore) return;

    const nextPage = data.pagination.page + 1;
    if (nextPage > data.pagination.totalPages) return;

    setIsLoadingMore(true);

    try {
      const response = await fetch(`/api/dashboard/earnings?timeRange=${timeRange}&page=${nextPage}&pageSize=${data.pagination.pageSize}`);
      const result = await response.json() as ApiResponse<any>;

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch more transactions');
      }

      // Merge the new transactions with existing ones
      setData(prevData => {
        if (!prevData) return null;

        return {
          ...prevData,
          transactions: [...prevData.transactions, ...result.data.transactions],
          pagination: result.data.pagination
        };
      });
    } catch (err) {
      logError(err, { context: 'Error loading more transactions' });
      setError(err instanceof Error ? err.message : 'Failed to load more transactions');
    } finally {
      setIsLoadingMore(false);
    }
  }, [data, timeRange, isLoadingMore]);

  // Effect to fetch initial data when timeRange changes
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    loadMoreTransactions
  };
}
