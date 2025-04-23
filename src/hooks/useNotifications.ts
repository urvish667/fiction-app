import { useState, useEffect, useCallback, useRef } from "react";
import { Notification, NotificationResponse, mockNotifications } from "@/types/notification";
import { fetchWithCsrf } from "@/lib/client/csrf";

interface UseNotificationsProps {
  useMockData?: boolean;
  initialType?: string;
}

/**
 * Hook for managing notifications with real-time updates via WebSocket
 */
export function useNotifications({ useMockData = true, initialType = "all" }: UseNotificationsProps = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialType);
  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (useMockData) {
      // Use mock data
      setNotifications(mockNotifications as any);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query parameters based on active tab
      let queryParams = new URLSearchParams();

      if (activeTab === "unread") {
        queryParams.append("read", "false");
      } else if (activeTab !== "all") {
        queryParams.append("type", activeTab);
      }

      const response = await fetch(`/api/notifications?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data: NotificationResponse = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, useMockData]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (useMockData) {
      // Update mock data
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      return;
    }

    try {
      const response = await fetchWithCsrf("/api/notifications/mark-read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: [id] }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, [notifications, useMockData]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (useMockData) {
      // Update mock data
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })));
      return;
    }

    try {
      const response = await fetchWithCsrf("/api/notifications/mark-read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ all: true }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.status}`);
      }

      // Update local state
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [notifications, useMockData]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    if (useMockData) {
      // Update mock data
      setNotifications(notifications.filter((notification) => notification.id !== id));
      return;
    }

    try {
      const response = await fetchWithCsrf(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`);
      }

      // Update local state
      setNotifications(notifications.filter((notification) => notification.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }, [notifications, useMockData]);

  // Filter notifications based on active tab
  const getFilteredNotificationsByType = useCallback(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((notification) => !notification.read);
      case "likes":
        return notifications.filter((notification) => notification.type === "like");
      case "comments":
        return notifications.filter((notification) => notification.type === "comment");
      case "follows":
        return notifications.filter((notification) => notification.type === "follow");
      case "chapters":
        return notifications.filter((notification) => notification.type === "chapter");
      case "donation":
        return notifications.filter((notification) => notification.type === "donation");
      case "system":
        return notifications.filter((notification) => notification.type === "system");
      default:
        return notifications;
    }
  }, [activeTab, notifications]);

  // Get flat list of filtered notifications
  const getFilteredNotifications = useCallback(() => {
    return getFilteredNotificationsByType();
  }, [getFilteredNotificationsByType]);

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

    // Get filtered notifications based on active tab
    const filtered = getFilteredNotificationsByType();

    // Group by date
    filtered.forEach((notification) => {
      const date = new Date(notification.createdAt || (notification.date as Date));

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
  }, [getFilteredNotificationsByType]);

  // Fetch notifications on mount and when activeTab changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up polling for notifications
  useEffect(() => {
    // Skip polling if using mock data
    if (useMockData) return;

    // Poll for new notifications every 15 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 15000); // 15 seconds

    // Clean up on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [useMockData, fetchNotifications]);

  // Get grouped notifications
  const groupedNotifications = groupNotificationsByDate();

  // Check if there are any notifications in any group
  const hasNotifications =
    groupedNotifications.today.length > 0 ||
    groupedNotifications.yesterday.length > 0 ||
    groupedNotifications.thisWeek.length > 0 ||
    groupedNotifications.thisMonth.length > 0 ||
    groupedNotifications.older.length > 0;

  return {
    notifications,
    filteredNotifications: getFilteredNotifications(),
    groupedNotifications,
    hasNotifications,
    loading,
    error,
    activeTab,
    setActiveTab,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
