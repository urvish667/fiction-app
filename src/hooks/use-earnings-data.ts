import { useState, useEffect, useCallback } from 'react';
import { DonationTransaction, PaginationInfo } from '@/types/dashboard';
import { DashboardService } from '@/lib/api/dashboard';

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
      // Note: Backend validator expects numbers but URL params are strings, so omit page/pageSize to use defaults
      const earningsResult = await DashboardService.getAuthorEarnings({ timeRange });

      if (!earningsResult.success || !earningsResult.data) {
        throw new Error(earningsResult.message || 'Failed to fetch earnings data');
      }

      // Fetch earnings chart data
      const chartResult = await DashboardService.getEarningsChart({ timeRange });

      if (!chartResult.success || !chartResult.data) {
        throw new Error(chartResult.message || 'Failed to fetch earnings chart data');
      }

      // Transform data to match frontend format
      const earningsData = earningsResult.data;
      const transformedData: TransformedEarningsData = {
        totalEarnings: earningsData.totalEarnings,
        thisMonthEarnings: earningsData.thisMonthEarnings,
        monthlyChange: earningsData.monthlyChange,
        stories: (earningsData.stories || []).map(story => ({
          id: story.id,
          title: story.title,
          genre: 'Unknown', // Backend doesn't provide genre info here
          reads: 0, // Backend doesn't provide reads for earnings
          earnings: story.earnings,
        })),
        transactions: (earningsData.transactions || []).map(txn => ({
          id: txn.id,
          donorId: '', // Not provided
          donorName: txn.donorName,
          donorUsername: txn.donorUsername,
          storyTitle: txn.storyTitle,
          amount: txn.amount,
          message: txn.message,
          createdAt: txn.createdAt,
        })),
        pagination: earningsData.pagination,
        chartData: (chartResult.data || []).map(point => ({
          name: point.name || '',
          earnings: point.earnings || 0,
        })),
      };

      setData(transformedData);
    } catch (err) {
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
      // Note: Same validation issue with page/pageSize, but for load more we can just refetch all data
      // In a proper implementation, this would use dedicated pagination endpoint or fix backend validators
      const result = await DashboardService.getAuthorEarnings({
        timeRange,
        // page: nextPage,
        // pageSize: data.pagination.pageSize
      });

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch more transactions');
      }

      const earningsData = result.data;

      // Merge the new transactions with existing ones
      setData(prevData => {
        if (!prevData) return null;

        return {
          ...prevData,
          transactions: [
            ...prevData.transactions,
            ...earningsData.transactions.map(txn => ({
              id: txn.id,
              donorId: '',
              donorName: txn.donorName,
              donorUsername: txn.donorUsername,
              storyTitle: txn.storyTitle,
              amount: txn.amount,
              message: txn.message,
              createdAt: txn.createdAt,
            }))
          ],
          pagination: earningsData.pagination
        };
      });
    } catch (err) {
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
