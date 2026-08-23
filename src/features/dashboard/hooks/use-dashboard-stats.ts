"use client";

import { useState, useEffect } from "react";
import type { DashboardStats } from "../types/dashboard.types";
import { DashboardService } from "../api/dashboard-api";

const DEFAULT_STATS: DashboardStats = {
  totalReads: 0,
  totalLikes: 0,
  totalComments: 0,
  totalFollowers: 0,
  totalEarnings: 0,
  readsChange: 0,
  likesChange: 0,
  commentsChange: 0,
  followersChange: 0,
  earningsChange: 0,
};

export function useDashboardStats(timeRange: string) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await DashboardService.getAuthorStats({ timeRange });

        if (isCancelled) return;

        if (!result.success || !result.data) {
          throw new Error(result.message || "Failed to fetch dashboard stats");
        }

        const backendData = result.data;
        setData({
          totalReads: backendData.totalReads || 0,
          totalLikes: backendData.totalLikes || 0,
          totalComments: backendData.totalComments || 0,
          totalFollowers: backendData.totalFollowers || 0,
          totalEarnings: backendData.totalEarnings || 0,
          readsChange: backendData.readsChange || 0,
          likesChange: backendData.likesChange || 0,
          commentsChange: backendData.commentsChange || 0,
          followersChange: backendData.followersChange || 0,
          earningsChange: backendData.earningsChange || 0,
        });
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setData(DEFAULT_STATS);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [timeRange]);

  return { data, isLoading, error };
}
