"use client";

import { useState, useEffect } from "react";
import type { UserStoryItem } from "../types/dashboard.types";
import { DashboardService } from "../api/dashboard-api";

export function useUserStories(timeRange: string = "all") {
  const [data, setData] = useState<UserStoryItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await DashboardService.getCurrentUserStories({ timeRange });

        if (isCancelled) return;

        if (!result.success || !result.data) {
          throw new Error(result.message || "Failed to fetch user stories");
        }

        setData(result.data);
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setData([]);
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
