import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";
import { Notification } from "@/types/notification";

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface NotificationListParams {
    page?: number;
    limit?: number;
    type?: string;
    read?: boolean;
    sortBy?: 'newest' | 'oldest';
}

export interface NotificationListResponse {
    notifications: Notification[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface UnreadCountResponse {
    unreadCount: number;
}

export interface MarkAsReadResponse {
    id: string;
    read: boolean;
    updatedAt: string;
}

export interface MarkAllAsReadResponse {
    updatedCount: number;
    message: string;
}

/**
 * Notification API service for interacting with the REST API endpoints
 */
export const NotificationService = {
    /**
     * Get user notifications with pagination and filters
     */
    async getNotifications(params?: NotificationListParams): Promise<ApiResponse<NotificationListResponse>> {
        try {
            // Build query string from params
            const queryParams = new URLSearchParams();
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined) {
                        queryParams.append(key, String(value));
                    }
                });
            }

            const query = queryParams.toString();
            const url = query ? `/notifications?${query}` : '/notifications';

            const response = await apiClient.get<{
                success: boolean;
                data: Notification[];
                pagination: {
                    total: number;
                    page: number;
                    limit: number;
                    pages: number;
                };
            }>(url);

            return {
                success: true,
                data: {
                    notifications: response.data,
                    pagination: response.pagination
                }
            };
        } catch (error: any) {
            logError(error.message || "Failed to fetch notifications", {
                context: 'Fetching notifications',
                params,
                status: error.status,
                errorDetails: error
            });
            return {
                success: false,
                message: error.message || "Failed to fetch notifications"
            };
        }
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
        try {
            const response = await apiClient.get<{
                success: boolean;
                data: {
                    unreadCount: number;
                };
            }>('/notifications/unread-count');

            return {
                success: true,
                data: response.data
            };
        } catch (error: any) {
            // Don't log 401 errors - they're expected when not authenticated
            if (error.status !== 401) {
                logError(error.message || "Failed to fetch unread count", {
                    context: 'Fetching unread notification count',
                    status: error.status,
                    errorDetails: error
                });
            }
            return {
                success: false,
                message: error.message || "Failed to fetch unread count"
            };
        }
    },

    /**
     * Mark a specific notification as read
     */
    async markAsRead(notificationId: string): Promise<ApiResponse<MarkAsReadResponse>> {
        try {
            const response = await apiClient.put<{
                success: boolean;
                data: {
                    id: string;
                    read: boolean;
                    updatedAt: string;
                };
            }>(`/notifications/${notificationId}/read`);

            return {
                success: true,
                data: response.data
            };
        } catch (error: any) {
            logError(error.message || "Failed to mark notification as read", {
                context: 'Marking notification as read',
                notificationId,
                status: error.status,
                errorDetails: error
            });
            return {
                success: false,
                message: error.message || "Failed to mark notification as read"
            };
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<ApiResponse<MarkAllAsReadResponse>> {
        try {
            const response = await apiClient.put<{
                success: boolean;
                data: {
                    updatedCount: number;
                    message: string;
                };
            }>('/notifications/read-all');

            return {
                success: true,
                data: response.data
            };
        } catch (error: any) {
            logError(error.message || "Failed to mark all notifications as read", {
                context: 'Marking all notifications as read',
                status: error.status,
                errorDetails: error
            });
            return {
                success: false,
                message: error.message || "Failed to mark all notifications as read"
            };
        }
    },

    /**
     * Delete a specific notification
     */
    async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
        try {
            const response = await apiClient.delete<{
                success: boolean;
                message: string;
            }>(`/notifications/${notificationId}`);

            return {
                success: true,
                message: response.message
            };
        } catch (error: any) {
            logError(error.message || "Failed to delete notification", {
                context: 'Deleting notification',
                notificationId,
                status: error.status,
                errorDetails: error
            });
            return {
                success: false,
                message: error.message || "Failed to delete notification"
            };
        }
    },

    /**
     * Delete all read notifications
     */
    async deleteAllRead(): Promise<ApiResponse<{ deletedCount: number; message: string }>> {
        try {
            const response = await apiClient.delete<{
                success: boolean;
                data: {
                    deletedCount: number;
                    message: string;
                };
            }>('/notifications/read');

            return {
                success: true,
                data: response.data
            };
        } catch (error: any) {
            logError(error.message || "Failed to delete read notifications", {
                context: 'Deleting all read notifications',
                status: error.status,
                errorDetails: error
            });
            return {
                success: false,
                message: error.message || "Failed to delete read notifications"
            };
        }
    },

    /**
     * Mark notification as read and delete it (combined operation)
     * This is a convenience method for the common pattern of marking as read then deleting
     */
    async markAsReadAndDelete(notificationId: string): Promise<ApiResponse<void>> {
        try {
            // First mark as read
            const markResponse = await this.markAsRead(notificationId);
            if (!markResponse.success) {
                return {
                    success: false,
                    message: markResponse.message || "Failed to mark notification as read"
                };
            }

            // Then delete
            const deleteResponse = await this.deleteNotification(notificationId);
            if (!deleteResponse.success) {
                return {
                    success: false,
                    message: deleteResponse.message || "Failed to delete notification"
                };
            }

            return {
                success: true,
                message: "Notification marked as read and deleted successfully"
            };
        } catch (error: any) {
            logError(error.message || "Failed to mark as read and delete notification", {
                context: 'Mark as read and delete notification',
                notificationId,
                status: error.status,
                errorDetails: error
            });
            return {
                success: false,
                message: error.message || "Failed to mark as read and delete notification"
            };
        }
    },
};
