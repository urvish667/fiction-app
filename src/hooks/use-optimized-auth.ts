/**
 * Optimized Authentication Hook
 * 
 * Provides automatic token refresh with debouncing and proactive refresh
 * to match the old fiction-app's session management capabilities.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { refreshToken as refreshTokenApi } from '@/lib/auth';

// Refresh debouncing - minimum 5 minutes between manual refreshes
const REFRESH_DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

// Proactive refresh - refresh 5 minutes before token expires
const PROACTIVE_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

// Token duration from backend (14 days)
const TOKEN_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export function useOptimizedAuth() {
    const { user, refreshUser } = useAuth();
    const lastRefreshRef = useRef(Date.now());
    const proactiveTimerRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Manually refresh the session with debouncing
     * Only refreshes if at least 5 minutes have passed since last refresh
     */
    const refreshSession = useCallback(async () => {
        const now = Date.now();

        // Check if enough time has passed since last refresh
        if (now - lastRefreshRef.current < REFRESH_DEBOUNCE_MS) {
            if (process.env.NODE_ENV !== 'production') {
                console.log('Refresh debounced - too soon since last refresh');
            }
            return false;
        }

        try {
            lastRefreshRef.current = now;
            await refreshTokenApi();

            // Refresh user data from backend
            if (refreshUser) {
                await refreshUser();
            }

            if (process.env.NODE_ENV !== 'production') {
                console.log('Session refreshed successfully');
            }

            return true;
        } catch (error) {
            console.error('Failed to refresh session:', error);
            return false;
        }
    }, [refreshUser]);

    /**
     * Set up proactive token refresh
     * Refreshes token 5 minutes before it expires
     */
    useEffect(() => {
        if (!user) {
            // Clear timer if user logs out
            if (proactiveTimerRef.current) {
                clearTimeout(proactiveTimerRef.current);
                proactiveTimerRef.current = null;
            }
            return;
        }

        // Calculate when to refresh (14 days - 5 minutes)
        const refreshTime = TOKEN_DURATION_MS - PROACTIVE_REFRESH_BUFFER_MS;

        if (process.env.NODE_ENV !== 'production') {
            console.log(`Proactive refresh scheduled in ${refreshTime / 1000 / 60 / 60} hours`);
        }

        // Set up timer for proactive refresh
        proactiveTimerRef.current = setTimeout(async () => {
            if (process.env.NODE_ENV !== 'production') {
                console.log('Proactive refresh triggered');
            }
            await refreshSession();
        }, refreshTime);

        // Cleanup on unmount or user change
        return () => {
            if (proactiveTimerRef.current) {
                clearTimeout(proactiveTimerRef.current);
                proactiveTimerRef.current = null;
            }
        };
    }, [user, refreshSession]);

    /**
     * Refresh on window focus (if enough time has passed)
     * This ensures the session stays fresh when user returns to the app
     */
    useEffect(() => {
        if (!user) return;

        const handleFocus = async () => {
            const now = Date.now();
            const timeSinceLastRefresh = now - lastRefreshRef.current;

            // Only refresh if more than 5 minutes since last refresh
            if (timeSinceLastRefresh > REFRESH_DEBOUNCE_MS) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Window focused - refreshing session');
                }
                await refreshSession();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [user, refreshSession]);

    return {
        refreshSession,
        lastRefreshTime: lastRefreshRef.current,
    };
}

export default useOptimizedAuth;
