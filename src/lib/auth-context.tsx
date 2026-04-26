'use client';

import { AuthService, AuthUser, LoginData, SignupData } from '@/lib/api/auth';
import { saveAuthUser, getAuthUser, clearAuthUser } from '@/lib/auth-storage';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

// Auth Context and Hook
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<AuthUser>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<AuthUser>;
  refreshUser: () => Promise<void>;
  googleAuth: (idToken?: string, accessToken?: string) => Promise<AuthUser>;
  discordAuth: (accessToken: string) => Promise<AuthUser>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state synchronously from localStorage
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      return getAuthUser();
    }
    return null;
  });

  // Start as loading only if we don't have a cached user
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !getAuthUser();
    }
    return true;
  });

  // Track pending getCurrentUser request to prevent duplicate calls
  const pendingAuthCheckRef = useRef<Promise<boolean> | null>(null);

  // Track last refresh time to avoid excessive refreshes
  const lastRefreshTimeRef = useRef<number>(0);

  // Track refresh interval
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthHandler();
  }, []);

  // Smart proactive token refresh - only when user is authenticated and active
  useEffect(() => {
    if (!user) {
      // Clear interval if user logs out
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Refresh token proactively 5 minutes before expiry (at 13 days 23 hours 55 minutes for 14-day tokens)
    const REFRESH_INTERVAL = (14 * 24 * 60 - 5) * 60 * 1000; // 14 days - 5 minutes
    const MIN_REFRESH_GAP = 5 * 60 * 1000; // Don't refresh if last refresh was < 5 minutes ago

    const refreshTokenProactively = async () => {
      // Skip if tab is hidden (user not active)
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      // Skip if we refreshed recently
      const timeSinceLastRefresh = Date.now() - lastRefreshTimeRef.current;
      if (timeSinceLastRefresh < MIN_REFRESH_GAP) {
        return;
      }

      try {
        await AuthService.refreshToken();
        lastRefreshTimeRef.current = Date.now();
      } catch (error) {
        // If refresh fails, user will be logged out on next API call
      }
    };

    // Set up interval for proactive refresh
    refreshIntervalRef.current = setInterval(refreshTokenProactively, REFRESH_INTERVAL);

    // Also refresh when tab becomes visible (if needed)
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        const timeSinceLastRefresh = Date.now() - lastRefreshTimeRef.current;
        // If it's been more than 1 hour since last refresh, refresh now
        if (timeSinceLastRefresh > 60 * 60 * 1000) {
          refreshTokenProactively();
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [user]);

  const loginHandler = async (data: LoginData): Promise<AuthUser> => {
    const response = await AuthService.login(data);
    if (response.success && response.data) {
      setUser(response.data.user);
      saveAuthUser(response.data.user); // Save to localStorage
      lastRefreshTimeRef.current = Date.now(); // Mark login time
      return response.data.user;
    }
    throw new Error(response.message || 'Login failed');
  };

  const logoutHandler = async (): Promise<void> => {
    await AuthService.logout();
    setUser(null);
    clearAuthUser(); // Clear localStorage
    lastRefreshTimeRef.current = 0;
  };

  const signupHandler = async (data: SignupData): Promise<AuthUser> => {
    const response = await AuthService.signup(data);
    if (response.success && response.data) {
      return response.data.user;
    }
    throw new Error(response.message || 'Signup failed');
  };

  const refreshUserHandler = async (): Promise<void> => {
    try {
      const response = await AuthService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data.user);
        saveAuthUser(response.data.user); // Sync with localStorage
      } else {
        setUser(null);
        clearAuthUser(); // Clear stale cache
      }
    } catch (error) {
      setUser(null);
      clearAuthUser(); // Clear stale cache
    }
  };

  const googleAuthHandler = async (idToken?: string, accessToken?: string): Promise<AuthUser> => {
    const response = await AuthService.googleAuth(idToken, accessToken);
    if (response.success && response.data) {
      setUser(response.data.user);
      saveAuthUser(response.data.user); // Save to localStorage
      lastRefreshTimeRef.current = Date.now(); // Mark auth time
      return response.data.user;
    }
    throw new Error(response.message || 'Google authentication failed');
  };

  const discordAuthHandler = async (accessToken: string): Promise<AuthUser> => {
    const response = await AuthService.discordAuth(accessToken);
    if (response.success && response.data) {
      setUser(response.data.user);
      saveAuthUser(response.data.user); // Save to localStorage
      lastRefreshTimeRef.current = Date.now(); // Mark auth time
      return response.data.user;
    }
    throw new Error(response.message || 'Discord authentication failed');
  };

  const checkAuthHandler = async (): Promise<boolean> => {
    // Only check if we don't already have a user
    if (user) {
      return true;
    }

    // If there's already a pending request, return it instead of making a new one
    if (pendingAuthCheckRef.current) {
      return pendingAuthCheckRef.current;
    }

    setIsLoading(true);

    // Create and store the promise
    const authCheckPromise = (async () => {
      try {
        const response = await AuthService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data.user);
          saveAuthUser(response.data.user); // Sync with localStorage
          lastRefreshTimeRef.current = Date.now(); // Mark check time
          return true;
        }
        // If API call fails, clear any stale cache
        clearAuthUser();
        setUser(null);
        return false;
      } catch (error) {
        // ✅ Don't clear user on network error — keep existing session
        // Only clear if server explicitly says unauthorized
        const cachedUser = getAuthUser();
        if (cachedUser) {
          setUser(cachedUser);
          return true; // Trust the cache on network failure
        }
        setUser(null);
        return false;
      } finally {
        setIsLoading(false);
        // Clear the pending request after completion
        pendingAuthCheckRef.current = null;
      }
    })();

    pendingAuthCheckRef.current = authCheckPromise;
    return authCheckPromise;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginHandler,
    logout: logoutHandler,
    signup: signupHandler,
    refreshUser: refreshUserHandler,
    googleAuth: googleAuthHandler,
    discordAuth: discordAuthHandler,
    checkAuth: checkAuthHandler,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
