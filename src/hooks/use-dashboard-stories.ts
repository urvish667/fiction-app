import { useState, useEffect } from 'react';
import { DashboardStory } from '@/types/dashboard';
import { DashboardService } from '@/lib/api/dashboard';

/**
 * Custom hook for fetching top performing stories
 * @param limit Number of stories to fetch
 * @param sortBy Field to sort by (reads, likes, comments, earnings)
 * @param timeRange Time range for filtering data (e.g., 7days, 30days, 90days, year, all)
 * @returns Stories data, loading state, and error state
 */
export function useDashboardStories(limit: number = 5, sortBy: string = 'reads', timeRange: string = '30days') {
  const [data, setData] = useState<DashboardStory[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Note: backend validator doesn't handle string to number conversion, so omitting limit to use default
        const result = await DashboardService.getTopStories({ sortBy, timeRange });

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to fetch stories');
        }

        // Transform backend data to frontend format
        const transformedData = result.data.map(story => ({
          id: story.id,
          title: story.title,
          genre: story.genreName || 'Unknown',
          genreName: story.genreName,
          slug: story.slug,
          reads: story.reads,
          likes: story.likes,
          comments: story.comments,
          date: new Date().toISOString(), // Fallback date since backend might not provide it
          earnings: story.earnings,
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
  }, [limit, sortBy, timeRange]);

  return { data, isLoading, error };
}
