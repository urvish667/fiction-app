import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export type ReportReason =
    | 'PORNOGRAPHIC_CONTENT'
    | 'HATE_OR_BULLYING'
    | 'RELEASE_OF_PERSONAL_INFO'
    | 'OTHER_INAPPROPRIATE_MATERIAL'
    | 'SPAM'
    | 'OTHER';

export interface ReportSubmissionData {
    storyId?: string;
    commentId?: string;
    postId?: string;
    forumCommentId?: string;
    reportedUserId?: string;
    reason: ReportReason;
    details?: string;
}

export interface ReportResponse {
    reportId: string;
    createdAt: Date;
}

/**
 * Report API service for interacting with the REST API endpoints
 */
export const ReportService = {
    /**
     * Submit a new report
     */
    async submitReport(data: ReportSubmissionData): Promise<ApiResponse<ReportResponse>> {
        try {
            const response = await apiClient.post<{
                success: boolean;
                message: string;
                data: ReportResponse;
            }>('/report', data);

            return {
                success: true,
                message: response.message,
                data: response.data
            };
        } catch (error: any) {
            logError(error.message || "Failed to submit report", {
                context: 'Submitting report',
                status: error.status,
                errorDetails: error
            });

            return {
                success: false,
                message: error.message || "Failed to submit report"
            };
        }
    },
};
