"use client";

import { useState, useEffect, useCallback } from "react";
import type { TransformedEarningsData } from "../types/dashboard.types";
import { DashboardService } from "../api/dashboard-api";

export function useEarningsData(timeRange: string) {
  const [data, setData] = useState<TransformedEarningsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const earningsResult = await DashboardService.getAuthorEarnings({ timeRange });
      if (!earningsResult.success || !earningsResult.data) {
        throw new Error(earningsResult.message || "Failed to fetch earnings data");
      }

      const chartResult = await DashboardService.getEarningsChart({ timeRange });
      if (!chartResult.success || !chartResult.data) {
        throw new Error(chartResult.message || "Failed to fetch earnings chart data");
      }

      const earningsData = earningsResult.data;
      const transformedData: TransformedEarningsData = {
        totalEarnings: earningsData.totalEarnings,
        thisMonthEarnings: earningsData.thisMonthEarnings,
        monthlyChange: earningsData.monthlyChange,
        stories: (earningsData.stories || []).map((story) => ({
          id: story.id,
          title: story.title,
          genre: "Unknown",
          reads: 0,
          earnings: story.earnings,
        })),
        transactions: (earningsData.transactions || []).map((txn) => ({
          id: txn.id,
          donorId: "",
          donorName: txn.donorName,
          donorUsername: txn.donorUsername,
          storyTitle: txn.storyTitle,
          amount: txn.amount,
          message: txn.message,
          createdAt: txn.createdAt,
        })),
        pagination: earningsData.pagination,
        chartData: (chartResult.data || []).map((point) => ({
          name: point.name || "",
          earnings: point.earnings || 0,
        })),
      };

      setData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  const loadMoreTransactions = useCallback(async () => {
    if (!data?.pagination || isLoadingMore) return;

    const nextPage = data.pagination.page + 1;
    if (nextPage > data.pagination.totalPages) return;

    setIsLoadingMore(true);

    try {
      const result = await DashboardService.getAuthorEarnings({ timeRange });

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch more transactions");
      }

      const earningsData = result.data;

      setData((prevData) => {
        if (!prevData) return null;

        return {
          ...prevData,
          transactions: [
            ...prevData.transactions,
            ...earningsData.transactions.map((txn) => ({
              id: txn.id,
              donorId: "",
              donorName: txn.donorName,
              donorUsername: txn.donorUsername,
              storyTitle: txn.storyTitle,
              amount: txn.amount,
              message: txn.message,
              createdAt: txn.createdAt,
            })),
          ],
          pagination: earningsData.pagination,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more transactions");
    } finally {
      setIsLoadingMore(false);
    }
  }, [data, timeRange, isLoadingMore]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    loadMoreTransactions,
  };
}
