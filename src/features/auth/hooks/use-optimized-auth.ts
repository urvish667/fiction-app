"use client";

/**
 * Optimized Authentication Hook
 * 
 * Provides automatic token refresh with debouncing and proactive refresh
 * to match session management requirements.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { refreshToken as refreshTokenApi } from '@/lib/auth';

const REFRESH_DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes
const PROACTIVE_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
const TOKEN_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export function useOptimizedAuth() {
    const { user, refreshUser } = useAuth();
    const lastRefreshRef = useRef(Date.now());
    const proactiveTimerRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Manually refresh the session with debouncing
     */
    const refreshSession = useCallback(async () => {
        const now = Date.now();

        // Guard: Debounce if called too quickly
        if (now - lastRefreshRef.current < REFRESH_DEBOUNCE_MS) {
            return false;
        }

        try {
            lastRefreshRef.current = now;
            await refreshTokenApi();

            if (refreshUser) {
                await refreshUser();
            }

            return true;
        } catch (error) {
            console.error('Failed to refresh session:', error);
            return false;
        }
    }, [refreshUser]);

    /**
     * Set up proactive token refresh
     */
    useEffect(() => {
        if (!user) {
            if (proactiveTimerRef.current) {
                clearTimeout(proactiveTimerRef.current);
                proactiveTimerRef.current = null;
            }
            return;
        }

        const refreshTime = TOKEN_DURATION_MS - PROACTIVE_REFRESH_BUFFER_MS;

        proactiveTimerRef.current = setTimeout(async () => {
            await refreshSession();
        }, refreshTime);

        return () => {
            if (proactiveTimerRef.current) {
                clearTimeout(proactiveTimerRef.current);
                proactiveTimerRef.current = null;
            }
        };
    }, [user, refreshSession]);

    /**
     * Refresh on window focus (if enough time has passed)
     */
    useEffect(() => {
        if (!user) return;

        const handleFocus = async () => {
            const now = Date.now();
            const timeSinceLastRefresh = now - lastRefreshRef.current;

            if (timeSinceLastRefresh <= REFRESH_DEBOUNCE_MS) return;

            await refreshSession();
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
