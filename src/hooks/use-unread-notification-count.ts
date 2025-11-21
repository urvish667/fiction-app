import { useState, useEffect, useCallback } from "react";
import { NotificationService } from "@/lib/api/notification";
import { logError } from "@/lib/error-logger";

/**
 * Hook for managing unread notification count with real-time updates
 * This hook can be used across multiple components to keep the count in sync
 */
export function useUnreadNotificationCount() {
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch unread count from API
    const fetchUnreadCount = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await NotificationService.getUnreadCount();

            if (response.success && response.data) {
                setUnreadCount(response.data.unreadCount);
            } else {
                setError(response.message || "Failed to fetch unread count");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred";
            setError(errorMessage);
            logError(err, { context: 'Error fetching unread notification count' });
        } finally {
            setLoading(false);
        }
    }, []);

    // Manually update the count (useful for optimistic updates)
    const updateCount = useCallback((newCount: number) => {
        setUnreadCount(newCount);
    }, []);

    // Increment the count
    const incrementCount = useCallback(() => {
        setUnreadCount(prev => prev + 1);
    }, []);

    // Decrement the count
    const decrementCount = useCallback(() => {
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    // Reset count to zero
    const resetCount = useCallback(() => {
        setUnreadCount(0);
    }, []);

    // Fetch initial count on mount
    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    // Set up periodic refresh of unread count (as a fallback)
    useEffect(() => {
        // Refresh count every 60 seconds
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    return {
        unreadCount,
        loading,
        error,
        fetchUnreadCount,
        updateCount,
        incrementCount,
        decrementCount,
        resetCount,
    };
}
