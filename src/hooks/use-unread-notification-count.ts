import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { NotificationService } from "@/lib/api/notification";
import { logError } from "@/lib/error-logger";

// Default polling interval: 5 minutes (increased from 1 minute to reduce API calls)
const DEFAULT_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MIN_POLL_INTERVAL = 60 * 1000; // 1 minute minimum
const MAX_POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes maximum
const RATE_LIMIT_BACKOFF_MULTIPLIER = 2; // Double the interval on rate limit

/**
 * Hook for managing unread notification count with intelligent polling.
 * Features:
 * - Exponential backoff on rate limits
 * - Configurable polling interval
 * - Automatic retry with backoff
 * - Skips API calls when user is not authenticated
 */
export function useUnreadNotificationCount() {
    const { user, isLoading: authLoading } = useAuth();
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track polling interval dynamically (can increase on rate limits)
    const pollIntervalRef = useRef<number>(DEFAULT_POLL_INTERVAL);
    const isRateLimitedRef = useRef<boolean>(false);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch unread count from API with rate limit handling
    const fetchUnreadCount = useCallback(async (isRetry = false) => {
        // If no authenticated user, reset count and skip request
        if (!user) {
            setUnreadCount(0);
            return;
        }

        // Skip if we're currently rate limited and this isn't a retry
        if (isRateLimitedRef.current && !isRetry) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await NotificationService.getUnreadCount();

            if (response.success && response.data) {
                setUnreadCount(response.data.unreadCount);
                // Reset polling interval on success
                pollIntervalRef.current = DEFAULT_POLL_INTERVAL;
                isRateLimitedRef.current = false;
            } else {
                // Check if it's a rate limit error
                const isRateLimit = response.message?.includes("429") ||
                    response.message?.includes("rate limit") ||
                    response.message?.includes("Too many requests");

                if (isRateLimit) {
                    handleRateLimit();
                }

                setError(response.message || "Failed to fetch unread count");
            }
        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred";

            // Check if error is rate limit related
            const isRateLimit = err?.status === 429 ||
                errorMessage.includes("429") ||
                errorMessage.includes("rate limit") ||
                errorMessage.includes("Too many requests");

            if (isRateLimit) {
                handleRateLimit();
            } else {
                setError(errorMessage);
                logError(err, { context: "Error fetching unread notification count" });
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Handle rate limiting with exponential backoff
    const handleRateLimit = useCallback(() => {
        isRateLimitedRef.current = true;

        // Increase polling interval (exponential backoff)
        const newInterval = Math.min(
            pollIntervalRef.current * RATE_LIMIT_BACKOFF_MULTIPLIER,
            MAX_POLL_INTERVAL
        );

        pollIntervalRef.current = newInterval;

        // Log the rate limit with new interval
        logError(
            new Error("Rate limit hit on notification unread count API"),
            {
                context: "Notification polling rate limited",
                newPollInterval: newInterval,
                willRetryIn: newInterval
            }
        );

        // Schedule a retry after the backoff period
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }

        retryTimeoutRef.current = setTimeout(() => {
            isRateLimitedRef.current = false;
            fetchUnreadCount(true);
        }, newInterval);
    }, [fetchUnreadCount]);

    // Initial fetch when component mounts or user changes
    useEffect(() => {
        if (user) {
            fetchUnreadCount();
        } else {
            setUnreadCount(0);
            // Reset rate limit state when user logs out
            isRateLimitedRef.current = false;
            pollIntervalRef.current = DEFAULT_POLL_INTERVAL;
        }
    }, [user, fetchUnreadCount]);

    // Periodic refresh with dynamic interval
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            fetchUnreadCount();
        }, pollIntervalRef.current);

        return () => clearInterval(interval);
    }, [user, fetchUnreadCount]);

    // Cleanup retry timeout on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

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
