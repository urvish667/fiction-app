import { useState, useEffect, useCallback, useRef } from "react";
import { Notification, NotificationResponse} from "@/types/notification";
import { fetchWithCsrf } from "@/lib/client/csrf";
import { getWebSocketClient, WebSocketStatus } from "@/lib/client/websocket-client";
import { useSession } from "next-auth/react";
import { logError, logInfo } from "@/lib/error-logger";

interface UseNotificationsProps {
  useMockData?: boolean;
  useWebSocket?: boolean;
}

/**
 * Hook for managing notifications with real-time updates via WebSocket
 */
export function useNotifications({
  useMockData = false,
  useWebSocket = true
}: UseNotificationsProps = {}) {
  const { data: session } = useSession();
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
  const wsConnectedRef = useRef(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasMore: false,
  });
  // Fetch notifications from API
  const fetchNotifications = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
      }
      setError(null);

      // Build query parameters
      let queryParams = new URLSearchParams();
      queryParams.append("page", reset ? "1" : (pagination.page + 1).toString());
      queryParams.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/notifications?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data: NotificationResponse = await response.json();

      if (reset) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }

      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        pages: data.pagination.pages,
        hasMore: data.pagination.page < data.pagination.pages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      logError(err, { context: 'Error fetching notifications' });
    } finally {
      if (reset) {
        setLoading(false);
      }
    }
  }, [useMockData, pagination.page, pagination.limit]);

  // Mark as read and delete notification (combined action)
  const markAsReadAndDelete = useCallback(async (id: string) => {
    if (useMockData) {
      // Update mock data - just remove the notification
      setNotifications(prev => prev.filter((notification) => notification.id !== id));
      return;
    }

    try {
      // First mark as read, then delete
      const markReadResponse = await fetchWithCsrf("/api/notifications/mark-read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: [id] }),
      });

      if (!markReadResponse.ok) {
        throw new Error(`Failed to mark notification as read: ${markReadResponse.status}`);
      }

      // Then delete the notification
      const deleteResponse = await fetchWithCsrf(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete notification: ${deleteResponse.status}`);
      }

      // Update local state - remove the notification using functional update
      setNotifications(prev => prev.filter((notification) => notification.id !== id));

      // Send WebSocket messages if connected
      const wsClient = getWebSocketClient();
      if (wsClient && wsClient.getStatus() === WebSocketStatus.CONNECTED) {
        wsClient.send({
          type: 'mark_read',
          id,
        });
        wsClient.send({
          type: 'delete',
          id,
        });
      }
    } catch (err) {
      logError(err, { context: 'Error marking notification as read and deleting' });
    }
  }, [useMockData]);

  // Load more notifications
  const loadMoreNotifications = useCallback(async () => {
    if (!pagination.hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      await fetchNotifications(false);
    } catch (err) {
      logError(err, { context: 'Error loading more notifications' });
    } finally {
      setIsLoadingMore(false);
    }
  }, [pagination.hasMore, isLoadingMore, fetchNotifications]);

  // Get all notifications (no filtering)
  const getFilteredNotifications = useCallback(() => {
    return notifications;
  }, [notifications]);

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

    // Get all notifications
    const filtered = getFilteredNotifications();

    // Group by date
    filtered.forEach((notification: Notification) => {
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
  }, [getFilteredNotifications]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'notification':
        // Add new notification to the list
        if (data.data) {
          setNotifications(prev => [data.data, ...prev]);
        }
        break;

      case 'mark_read':
        // Update notification read status
        if (data.ids) {
          if (data.ids === 'all') {
            setNotifications(prev =>
              prev.map(notification => ({ ...notification, read: true }))
            );
          } else if (Array.isArray(data.ids)) {
            setNotifications(prev =>
              prev.map(notification =>
                data.ids.includes(notification.id)
                  ? { ...notification, read: true }
                  : notification
              )
            );
          }
        }
        break;

      case 'delete':
        // Remove notification from the list
        if (data.id) {
          setNotifications(prev =>
            prev.filter(notification => notification.id !== data.id)
          );
        }
        break;

      case 'connection':
        // Connection status update
        logInfo(`WebSocket connection status: ${data.status}`, { context: 'useNotifications' });
        break;

      case 'pong':
        // Pong response (keep-alive)
        break;

      default:
        logInfo(`Unknown WebSocket message type: ${data.type}`, { context: 'useNotifications' });
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Skip if using mock data or WebSocket is disabled
    if (useMockData || !useWebSocket || !session?.user?.id) return;

    // Get JWT token for WebSocket authentication
    const getToken = async () => {
      try {
        // Get token from session or fetch from API
        const response = await fetch('/api/auth/ws-token');

        if (!response.ok) {
          const errorText = await response.text();
          logError(`Failed to get WebSocket token: ${response.status} ${response.statusText}`, { context: 'useNotifications', errorText });
          throw new Error(`Failed to get WebSocket token: ${response.status} ${response.statusText}`);
        }

        const { token } = await response.json();

        // Log WebSocket URL for debugging
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/api/ws';
        logInfo(`Connecting to WebSocket server at: ${wsUrl}`, { context: 'useNotifications' });

        // Initialize WebSocket client
        const wsClient = getWebSocketClient({
          url: wsUrl,
          token,
          onMessage: handleWebSocketMessage,
          onStatusChange: (status) => {
            logInfo(`WebSocket status changed: ${status}`, { context: 'useNotifications' });
            setWsStatus(status);
          },
        });

        // Connect to WebSocket server
        if (wsClient) {
          wsClient.connect();
          wsConnectedRef.current = true;
        } else {
          logError('Failed to create WebSocket client', { context: 'useNotifications' });
          setError('Failed to create WebSocket client');
        }
      } catch (error) {
        logError(error, { context: 'Failed to initialize WebSocket' });
        setError('Failed to connect to notification service');
      }
    };

    getToken();

    // Clean up on unmount
    return () => {
      const wsClient = getWebSocketClient();
      if (wsClient && wsConnectedRef.current) {
        wsClient.disconnect();
        wsConnectedRef.current = false;
      }
    };
  }, [session, useMockData, useWebSocket, handleWebSocketMessage]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Set up polling for notifications as fallback when WebSocket is not connected
  useEffect(() => {
    // Skip polling if using mock data or WebSocket is connected
    if (useMockData || (useWebSocket && wsStatus === WebSocketStatus.CONNECTED)) return;

    // Track page visibility
    let isVisible = true;
    let pollInterval: NodeJS.Timeout | null = null;

    // Function to start polling
    const startPolling = () => {
      // Clear any existing interval
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      // Poll for new notifications less frequently (60 seconds instead of 15)
      // This reduces Redis connection cycling while still providing updates
      pollInterval = setInterval(() => {
        // Only poll if the page is visible
        if (isVisible) {
          logInfo('Polling for notifications (fallback mode)', { context: 'useNotifications' });
          fetchNotifications(true);
        } else {
          logInfo('Skipping notification poll - page not visible', { context: 'useNotifications' });
        }
      }, 60000); // 60 seconds
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';

      if (isVisible) {
        logInfo('Page became visible, fetching notifications', { context: 'useNotifications' });
        // Fetch immediately when page becomes visible
        fetchNotifications(true);
        // Restart polling
        startPolling();
      } else {
        logInfo('Page hidden, pausing notification polling', { context: 'useNotifications' });
        // Optionally clear the interval when page is hidden
        // if (pollInterval) {
        //   clearInterval(pollInterval);
        //   pollInterval = null;
        // }
      }
    };

    // Initial fetch
    fetchNotifications(true);

    // Start polling
    startPolling();

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [useMockData, useWebSocket, wsStatus, fetchNotifications]);

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
    isLoadingMore,
    error,
    markAsReadAndDelete,
    loadMoreNotifications,
    hasMore: pagination.hasMore,
    pagination,
    refetch: fetchNotifications,
    wsStatus,
  };
}
