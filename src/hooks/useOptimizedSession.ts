/**
 * Optimized Session Hook
 *
 * This hook wraps the NextAuth useSession hook to provide more control over
 * session refreshes and reduce unnecessary polling.
 */

import { useSession, signIn, signOut } from 'next-auth/react';
import { useCallback, useEffect, useRef } from 'react';

interface UseOptimizedSessionOptions {
  // Whether to enable manual refresh functionality
  enableManualRefresh?: boolean;
  // Callback when session expires
  onExpired?: () => void;
}

/**
 * Hook for optimized session management
 *
 * This hook wraps the NextAuth useSession hook to provide more control over
 * session refreshes and reduce unnecessary polling.
 */
export function useOptimizedSession(options: UseOptimizedSessionOptions = {}) {
  const { enableManualRefresh = false, onExpired } = options;

  // Use the standard NextAuth session hook
  const { data: session, status, update } = useSession();

  // Keep track of when the session was last refreshed
  const lastRefreshRef = useRef<number>(Date.now());

  // Calculate session expiry time (if available)
  const sessionExpiry = session?.expires ? new Date(session.expires).getTime() : null;

  // Function to manually refresh the session
  const refreshSession = useCallback(async () => {
    // Only refresh if it's been at least 5 minutes since the last refresh
    const now = Date.now();
    if (now - lastRefreshRef.current >= 5 * 60 * 1000) {
      lastRefreshRef.current = now;
      await update();
      return true;
    }
    return false;
  }, [update]);

  // Check for session expiration and set up proactive refresh
  useEffect(() => {
    if (!enableManualRefresh || !sessionExpiry) return;

    // Calculate time until session expires (with 5 minute buffer)
    const timeUntilExpiry = sessionExpiry - Date.now() - (5 * 60 * 1000);

    // If session is about to expire or has expired, call the onExpired callback
    if (timeUntilExpiry <= 0) {
      if (onExpired) {
        onExpired();
      }
      // Try to refresh the session immediately if it's expired
      refreshSession();
      return;
    }

    // Always set up a timer to refresh the session before it expires
    // This is especially important now that we've disabled automatic polling

    const timer = setTimeout(() => {
      refreshSession();
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [sessionExpiry, enableManualRefresh, onExpired, refreshSession, session]);

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    refreshSession,
    signIn,
    signOut
  };
}

export default useOptimizedSession;
