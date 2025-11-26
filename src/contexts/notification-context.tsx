/**
 * Notification Context Provider
 * 
 * Provides global notification state with REST API on-demand fetching:
 * - Fetch on login
 * - Fetch when visiting notifications page
 * - Fetch when tab becomes visible after being hidden
 * - No real-time updates (WebSocket/polling disabled but preserved for future use)
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Notification } from '@/types/notification';
import { NotificationService } from '@/lib/api/notification';
import { AuthService } from '@/lib/api/auth';
import { createNotificationWebSocketClient } from '@/lib/websocket/notification-client';
import { NotificationWebSocketClient } from '@/lib/websocket/notification-client';
import { ConnectionStatus, NotificationMode } from '@/lib/websocket/types';
import { logError, logInfo, logWarning } from '@/lib/error-logger';

interface NotificationContextValue {
    notifications: Notification[];
    unreadCount: number;
    mode: NotificationMode;
    connectionStatus: ConnectionStatus;
    loading: boolean;
    error: string | null;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
    refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
    children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [mode, setMode] = useState<NotificationMode>(NotificationMode.POLLING);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsClient = useRef<NotificationWebSocketClient | null>(null);
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);
    const notificationIds = useRef<Set<string>>(new Set());

    /**
     * Fetch notifications from REST API
     */
    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            const response = await NotificationService.getNotifications({
                page: 1,
                limit: 50,
            });

            if (response.success && response.data) {
                const newNotifications = response.data.notifications;

                // Deduplicate notifications
                const uniqueNotifications = newNotifications.filter(
                    (notif) => !notificationIds.current.has(notif.id)
                );

                if (uniqueNotifications.length > 0) {
                    setNotifications((prev) => {
                        const merged = [...uniqueNotifications, ...prev];
                        // Keep only latest 100 notifications in memory
                        return merged.slice(0, 100);
                    });

                    // Update notification IDs set
                    uniqueNotifications.forEach((notif) => {
                        notificationIds.current.add(notif.id);
                    });
                }
            }
        } catch (err) {
            logError(err, { context: 'Failed to fetch notifications' });
            setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Fetch unread count
     */
    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;

        try {
            const response = await NotificationService.getUnreadCount();
            if (response.success && response.data) {
                setUnreadCount(response.data.unreadCount);
            }
        } catch (err) {
            logError(err, { context: 'Failed to fetch unread count' });
        }
    }, [user]);

    /**
     * Add a new notification (from WebSocket or polling)
     */
    const addNotification = useCallback((notification: Notification) => {
        // Deduplicate
        if (notificationIds.current.has(notification.id)) {
            return;
        }

        notificationIds.current.add(notification.id);
        setNotifications((prev) => [notification, ...prev].slice(0, 100));

        if (!notification.read) {
            setUnreadCount((prev) => prev + 1);
        }

        logInfo('New notification added', { id: notification.id, type: notification.type });
    }, []);

    /**
     * Mark notification as read
     */
    const markAsRead = useCallback(async (id: string) => {
        try {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === id ? { ...notif, read: true } : notif
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));

            // Send to server via REST API
            await NotificationService.markAsRead(id);

            /* WEBSOCKET CODE (PRESERVED FOR FUTURE USE)
             * if (mode === NotificationMode.WEBSOCKET && wsClient.current?.isConnected()) {
             *     wsClient.current.markAsRead(id);
             * } else {
             *     await NotificationService.markAsRead(id);
             * }
             */
        } catch (err) {
            logError(err, { context: 'Failed to mark notification as read' });
            // Revert optimistic update
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [fetchNotifications, fetchUnreadCount]);

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = useCallback(async () => {
        try {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((notif) => ({ ...notif, read: true }))
            );
            setUnreadCount(0);

            // Send to server via REST API
            await NotificationService.markAllAsRead();

            /* WEBSOCKET CODE (PRESERVED FOR FUTURE USE)
             * if (mode === NotificationMode.WEBSOCKET && wsClient.current?.isConnected()) {
             *     wsClient.current.markAllAsRead();
             * } else {
             *     await NotificationService.markAllAsRead();
             * }
             */
        } catch (err) {
            logError(err, { context: 'Failed to mark all notifications as read' });
            // Revert optimistic update
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [fetchNotifications, fetchUnreadCount]);

    /**
     * Delete notification
     */
    const deleteNotification = useCallback(async (id: string) => {
        try {
            const notification = notifications.find((n) => n.id === id);

            // Optimistic update
            setNotifications((prev) => prev.filter((notif) => notif.id !== id));
            notificationIds.current.delete(id);

            if (notification && !notification.read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }

            // Delete from server
            await NotificationService.deleteNotification(id);
        } catch (err) {
            logError(err, { context: 'Failed to delete notification' });
            // Revert optimistic update
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [notifications, fetchNotifications, fetchUnreadCount]);

    /**
     * Start polling for notifications
     */
    const startPolling = useCallback(() => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
        }

        setMode(NotificationMode.POLLING);
        logInfo('Started polling mode');

        // Initial fetch
        fetchNotifications();
        fetchUnreadCount();

        // Poll based on page visibility
        const getPollingInterval = () => {
            return document.visibilityState === 'visible' ? 30000 : 60000; // 30s visible, 60s hidden
        };

        let currentInterval = getPollingInterval();

        const poll = () => {
            fetchNotifications();
            fetchUnreadCount();

            // Adjust interval based on visibility
            const newInterval = getPollingInterval();
            if (newInterval !== currentInterval) {
                currentInterval = newInterval;
                startPolling(); // Restart with new interval
            }
        };

        pollingInterval.current = setInterval(poll, currentInterval);

        // Listen for visibility changes
        const handleVisibilityChange = () => {
            const newInterval = getPollingInterval();
            if (newInterval !== currentInterval) {
                startPolling(); // Restart with new interval
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchNotifications, fetchUnreadCount]);

    /**
     * Stop polling
     */
    const stopPolling = useCallback(() => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
            logInfo('Stopped polling mode');
        }
    }, []);

    /**
     * Initialize WebSocket connection
     */
    const initializeWebSocket = useCallback(async () => {
        if (!user) return;

        try {
            // Get WebSocket token
            const tokenResponse = await AuthService.getWebSocketToken();

            if (!tokenResponse.success || !tokenResponse.data?.token) {
                logWarning('Failed to get WebSocket token, falling back to polling');
                startPolling();
                return;
            }

            const wsToken = tokenResponse.data.token;

            // Create WebSocket client
            wsClient.current = createNotificationWebSocketClient({
                onConnect: () => {
                    logInfo('WebSocket connected, switching from polling to WebSocket mode');
                    stopPolling();
                    setMode(NotificationMode.WEBSOCKET);
                    setConnectionStatus(ConnectionStatus.CONNECTED);

                    // Fetch initial data
                    fetchNotifications();
                    fetchUnreadCount();
                },
                onDisconnect: () => {
                    logWarning('WebSocket disconnected');
                    setConnectionStatus(ConnectionStatus.DISCONNECTED);
                },
                onNotification: (notification: Notification) => {
                    addNotification(notification);
                },
                onError: (error: Error) => {
                    logError(error, { context: 'WebSocket error' });
                },
                onReconnecting: (attempt: number) => {
                    logInfo(`WebSocket reconnecting (attempt ${attempt})`);
                    setConnectionStatus(ConnectionStatus.RECONNECTING);
                },
                onReconnectFailed: () => {
                    logWarning('WebSocket reconnection failed, falling back to polling');
                    setConnectionStatus(ConnectionStatus.FAILED);
                    startPolling();
                },
            });

            // Connect to WebSocket
            await wsClient.current.connect(wsToken);
            setConnectionStatus(ConnectionStatus.CONNECTING);

        } catch (err) {
            logError(err, { context: 'Failed to initialize WebSocket' });
            startPolling();
        }
    }, [user, addNotification, fetchNotifications, fetchUnreadCount, startPolling, stopPolling]);

    /**
     * Initialize notification system when user logs in
     * STRATEGY: REST API only with strategic fetch triggers
     */
    useEffect(() => {
        if (!user) {
            // Clean up when user logs out
            setNotifications([]);
            setUnreadCount(0);
            notificationIds.current.clear();
            setMode(NotificationMode.OFFLINE);
            setConnectionStatus(ConnectionStatus.DISCONNECTED);
            return;
        }

        // TRIGGER 1: Fetch on login
        fetchNotifications();
        fetchUnreadCount();

        // TRIGGER 3: Fetch when tab becomes visible after being hidden
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchNotifications();
                fetchUnreadCount();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup on unmount
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };

        /* ============================================
         * WEBSOCKET & POLLING CODE (PRESERVED FOR FUTURE USE)
         * ============================================
         * 
         * To re-enable WebSocket/polling, uncomment the code below:
         * 
         * // Try WebSocket first, fall back to polling if it fails
         * initializeWebSocket();
         * 
         * // Cleanup on unmount
         * return () => {
         *     wsClient.current?.disconnect();
         *     stopPolling();
         * };
         * 
         * ============================================ */
    }, [user, fetchNotifications, fetchUnreadCount]);

    const value: NotificationContextValue = {
        notifications,
        unreadCount,
        mode,
        connectionStatus,
        loading,
        error,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch: fetchNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

/**
 * Hook to use notification context
 */
export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within NotificationProvider');
    }
    return context;
}
