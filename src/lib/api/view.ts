import { apiClient } from '@/lib/apiClient';

/**
 * View Tracking API
 * Handles story and chapter view tracking
 */

interface TrackViewResponse {
    success: boolean;
    data: {
        viewCount: number;
        isFirstView: boolean;
        chapterViewCount?: number;
        storyViewCount?: number;
    };
}

interface GetViewsResponse {
    success: boolean;
    data: {
        viewCount: number;
    };
}

export const ViewAPI = {
    /**
     * Track a story view
     * @param storyId - The ID of the story being viewed
     */
    async trackStoryView(storyId: string): Promise<TrackViewResponse> {
        const response = await apiClient.post<TrackViewResponse>(
            `/stories/${storyId}/view`
        );
        return response;
    },

    /**
     * Track a chapter view
     * @param chapterId - The ID of the chapter being viewed
     */
    async trackChapterView(chapterId: string): Promise<TrackViewResponse> {
        const response = await apiClient.post<TrackViewResponse>(
            `/chapters/${chapterId}/view`
        );
        return response;
    },

    /**
     * Get view count for a story
     * @param storyId - The ID of the story
     */
    async getStoryViews(storyId: string): Promise<number> {
        const response = await apiClient.get<GetViewsResponse>(
            `/stories/${storyId}/views`
        );
        return response.data.viewCount;
    },

    /**
     * Get view count for a chapter
     * @param chapterId - The ID of the chapter
     */
    async getChapterViews(chapterId: string): Promise<number> {
        const response = await apiClient.get<GetViewsResponse>(
            `/chapters/${chapterId}/views`
        );
        return response.data.viewCount;
    },
};
