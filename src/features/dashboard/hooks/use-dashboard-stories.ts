"use client";

import { useState, useEffect } from "react";
import type { DashboardStory } from "../types/dashboard.types";
import { DashboardService } from "../api/dashboard-api";

export function useDashboardStories(
  limit: number = 5,
  sortBy: string = "reads",
  timeRange: string = "30days"
) {
  const [data, setData] = useState<DashboardStory[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await DashboardService.getTopStories({ sortBy, timeRange });

        if (isCancelled) return;

        if (!result.success || !result.data) {
          throw new Error(result.message || "Failed to fetch stories");
        }

        const transformedData: DashboardStory[] = result.data.map((story) => ({
          id: story.id,
          title: story.title,
          genre: story.genreName || "Unknown",
          genreName: story.genreName,
          slug: story.slug,
          reads: story.reads,
          likes: story.likes,
          comments: story.comments,
          date: new Date().toISOString(),
          earnings: story.earnings,
        }));

        setData(transformedData);
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
  }, [limit, sortBy, timeRange]);

  return { data, isLoading, error };
}
