"use client";

import { useState, useEffect } from "react";
import type { ReadsDataPoint, EngagementDataPoint, EarningsDataPoint } from "../types/dashboard.types";
import { DashboardService } from "../api/dashboard-api";

export function useReadsChartData(timeRange: string) {
  const [data, setData] = useState<ReadsDataPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await DashboardService.getReadsChart({ timeRange });

        if (isCancelled) return;

        if (!result.success || !result.data) {
          throw new Error(result.message || "Failed to fetch reads chart data");
        }

        const transformedData = (result.data || []).map((point) => ({
          name: point.name || "",
          reads: point.reads || 0,
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
  }, [timeRange]);

  return { data, isLoading, error };
}

export function useEngagementChartData(timeRange: string) {
  const [data, setData] = useState<EngagementDataPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await DashboardService.getEngagementChart({ timeRange });

        if (isCancelled) return;

        if (!result.success || !result.data) {
          throw new Error(result.message || "Failed to fetch engagement chart data");
        }

        const transformedData = (result.data || []).map((point) => ({
          name: point.name || "",
          likes: point.likes || 0,
          comments: point.comments || 0,
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
  }, [timeRange]);

  return { data, isLoading, error };
}

export function useEarningsChartData(timeRange: string) {
  const [data, setData] = useState<EarningsDataPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await DashboardService.getEarningsChart({ timeRange });

        if (isCancelled) return;

        if (!result.success || !result.data) {
          throw new Error(result.message || "Failed to fetch earnings chart data");
        }

        const transformedData = (result.data || []).map((point) => ({
          name: point.name || "",
          earnings: point.earnings || 0,
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
  }, [timeRange]);

  return { data, isLoading, error };
}
