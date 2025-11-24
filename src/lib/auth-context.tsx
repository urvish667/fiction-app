'use client';

import { AuthService, AuthUser, LoginData, SignupData } from '@/lib/api/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track pending getCurrentUser request to prevent duplicate calls
  const pendingAuthCheckRef = React.useRef<Promise<boolean> | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthHandler();
  }, []);

  const loginHandler = async (data: LoginData): Promise<AuthUser> => {
    const response = await AuthService.login(data);
    if (response.success && response.data) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message || 'Login failed');
  };

  const logoutHandler = async (): Promise<void> => {
    await AuthService.logout();
    setUser(null);
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
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  const googleAuthHandler = async (idToken?: string, accessToken?: string): Promise<AuthUser> => {
    const response = await AuthService.googleAuth(idToken, accessToken);
    if (response.success && response.data) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message || 'Google authentication failed');
  };

  const discordAuthHandler = async (accessToken: string): Promise<AuthUser> => {
    const response = await AuthService.discordAuth(accessToken);
    if (response.success && response.data) {
      setUser(response.data.user);
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
          return true;
        }
        return false;
      } catch (error) {
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
