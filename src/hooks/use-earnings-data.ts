import { useState, useEffect } from 'react';
import { ApiResponse } from '@/types/dashboard';
import { logError } from '@/lib/error-logger';

// Define the types for the earnings data
interface EarningsData {
  total: number;
  change: number;
  recentDonations: Array<{
    id: string;
    amount: number;
    donorName: string;
    date: string;
    storyTitle?: string;
  }>;
}

// Define the transformed data structure that matches what the component expects
interface TransformedEarningsData {
  totalEarnings: number;
  thisMonthEarnings: number;
  monthlyChange: number;
  stories: Array<{
    id: string;
    title: string;
    genre: string;
    reads: number;
    earnings: number;
  }>;
  chartData: Array<{
    name: string;
    earnings: number;
  }>;
}

/**
 * Custom hook for fetching earnings data
 * @param timeRange The time range for the earnings data
 * @returns Earnings data, loading state, and error state
 */
export function useEarningsData(timeRange: string) {
  const [data, setData] = useState<TransformedEarningsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch earnings data
        const earningsResponse = await fetch(`/api/dashboard/earnings?timeRange=${timeRange}`);
        const earningsResult = await earningsResponse.json() as ApiResponse<EarningsData>;

        if (!earningsResult.success || !earningsResult.data) {
          throw new Error(earningsResult.error || 'Failed to fetch earnings data');
        }

        // Fetch earnings chart data
        const chartResponse = await fetch(`/api/dashboard/charts/earnings?timeRange=${timeRange}`);
        const chartResult = await chartResponse.json() as ApiResponse<Array<{name: string, earnings: number}>>;

        if (!chartResult.success || !chartResult.data) {
          throw new Error(chartResult.error || 'Failed to fetch earnings chart data');
        }

        // Transform the data to match what the component expects
        const transformedData: TransformedEarningsData = {
          totalEarnings: earningsResult.data.total,
          thisMonthEarnings: earningsResult.data.total, // Using total as a fallback
          monthlyChange: earningsResult.data.change,
          // Create a placeholder for stories based on recent donations
          stories: earningsResult.data.recentDonations.map(donation => ({
            id: donation.id,
            title: donation.storyTitle || 'Unknown Story',
            genre: '',
            reads: 0,
            earnings: donation.amount,
          })),
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
    };

    fetchData();
  }, [timeRange]);

  return { data, isLoading, error };
}
