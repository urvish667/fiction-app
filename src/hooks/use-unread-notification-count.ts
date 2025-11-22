import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { NotificationService } from "@/lib/api/notification";
import { logError } from "@/lib/error-logger";

/**
 * Hook for managing unread notification count with real-time updates.
 * Skips API calls when the user is not authenticated to avoid 401 errors on public pages.
 */
export function useUnreadNotificationCount() {
    const { user, isLoading: authLoading } = useAuth();
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch unread count from API
    const fetchUnreadCount = useCallback(async () => {
        // If no authenticated user, reset count and skip request
        if (!user) {
            setUnreadCount(0);
            return;
        }
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
            logError(err, { context: "Error fetching unread notification count" });
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial fetch when component mounts or user changes
    useEffect(() => {
        if (user) {
            fetchUnreadCount();
        } else {
            setUnreadCount(0);
        }
    }, [fetchUnreadCount, user]);

    // Periodic refresh (fallback) – only when user is present
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 60000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount, user]);

    // Helper functions for manual adjustments
    const updateCount = useCallback((newCount: number) => {
        setUnreadCount(newCount);
    }, []);

    const incrementCount = useCallback(() => {
        setUnreadCount((prev) => prev + 1);
    }, []);

    const decrementCount = useCallback(() => {
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    const resetCount = useCallback(() => {
        setUnreadCount(0);
    }, []);

    return {
        unreadCount,
        loading: loading || authLoading,
        error,
        fetchUnreadCount,
        updateCount,
        incrementCount,
        decrementCount,
        resetCount,
    };
}
