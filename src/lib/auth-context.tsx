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
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await AuthService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data.user);
        }
      } catch (error) {
        // User is not authenticated, that's expected for public pages
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
