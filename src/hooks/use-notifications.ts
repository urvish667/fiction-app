import { useState, useEffect, useCallback } from "react";
import { Notification } from "@/types/notification";
import { NotificationService } from "@/lib/api/notification";
import { useAuth } from "@/lib/auth-context";
import { logError } from "@/lib/error-logger";
import { useNotificationContext } from "@/contexts/notification-context";

interface UseNotificationsProps {
  useMockData?: boolean;
}

/**
 * Hook for managing notifications with hybrid WebSocket/polling support
 * Wraps the global NotificationContext and adds pagination support
 */
export function useNotifications({
  useMockData = false,
}: UseNotificationsProps = {}) {
  const { user } = useAuth();
  const {
    notifications: contextNotifications,
    loading: contextLoading,
    error: contextError,
    markAllAsRead: contextMarkAllAsRead,
    deleteNotification: contextDeleteNotification,
    refetch: contextRefetch
  } = useNotificationContext();

  const [olderNotifications, setOlderNotifications] = useState<Notification[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasMore: false,
  });

  // Combine context notifications (live/latest) with older fetched notifications
  // Deduplicate by ID
  const getCombinedNotifications = useCallback(() => {
    const combined = [...contextNotifications];
    const contextIds = new Set(contextNotifications.map(n => n.id));

    olderNotifications.forEach(notification => {
      if (!contextIds.has(notification.id)) {
        combined.push(notification);
      }
    });

    return combined;
  }, [contextNotifications, olderNotifications]);

  const notifications = getCombinedNotifications();

  // Load more notifications (pagination)
  const loadMoreNotifications = useCallback(async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await NotificationService.getNotifications({
        page: nextPage,
        limit: pagination.limit,
      });

      if (response.success && response.data) {
        const { notifications: newNotifications, pagination: paginationData } = response.data;

        setOlderNotifications(prev => [...prev, ...newNotifications]);
        setPagination({
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          pages: paginationData.pages,
          hasMore: paginationData.page < paginationData.pages,
        });
      }
    } catch (err) {
      logError(err, { context: 'Error loading more notifications' });
    } finally {
      setIsLoadingMore(false);
    }
  }, [pagination, isLoadingMore]);

  // Mark as read and delete notification
  const markAsReadAndDelete = useCallback(async (id: string) => {
    if (useMockData) {
      return;
    }

    // Use context to delete (which handles optimistic updates)
    // The backend handles decrementing unread count on delete
    contextDeleteNotification(id);

    // Also remove from local olderNotifications if present
    setOlderNotifications(prev => prev.filter(n => n.id !== id));
  }, [useMockData, contextDeleteNotification]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (useMockData) {
      return;
    }
    contextMarkAllAsRead();

    // Update local state
    setOlderNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [useMockData, contextMarkAllAsRead]);

  // Group notifications by date
  const groupNotificationsByDate = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const groups: { [key: string]: Notification[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    };

    notifications.forEach((notification: Notification) => {
      const date = new Date(notification.createdAt);

      if (date >= today) {
        groups.today.push(notification);
      } else if (date >= yesterday) {
        groups.yesterday.push(notification);
      } else if (date >= lastWeek) {
        groups.thisWeek.push(notification);
      } else if (date >= lastMonth) {
        groups.thisMonth.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  // Initialize pagination state from context if available
  // (This is a bit tricky since context doesn't expose pagination, 
  // but we can assume context has page 1)
  useEffect(() => {
    if (contextNotifications.length > 0 && pagination.total === 0) {
      // We don't know the total from context, but we can set hasMore to true initially
      // to allow trying to load more
      setPagination(prev => ({ ...prev, hasMore: true }));
    }
  }, [contextNotifications.length, pagination.total]);

  const groupedNotifications = groupNotificationsByDate();

  const hasNotifications = notifications.length > 0;

  return {
    notifications,
    filteredNotifications: notifications, // Alias for compatibility
    groupedNotifications,
    hasNotifications,
    loading: contextLoading,
    isLoadingMore,
    error: contextError,
    markAsReadAndDelete,
    markAllAsRead,
    loadMoreNotifications,
    hasMore: pagination.hasMore,
    pagination,
    refetch: contextRefetch,
  };
}
