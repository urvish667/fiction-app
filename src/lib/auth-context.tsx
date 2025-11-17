'use client';

import { AuthUser, getCurrentUser, login, logout, signup, googleOAuth, twitterOAuth, LoginData, SignupData } from './auth';
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
  googleAuth: (idToken: string) => Promise<AuthUser>;
  twitterAuth: (accessToken: string) => Promise<AuthUser>;
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
    const response = await getCurrentUser();
    if (response.success) {
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
    const response = await login(data);
    if (response.success) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message);
  };

  const logoutHandler = async (): Promise<void> => {
    await logout();
    setUser(null);
  };

  const signupHandler = async (data: SignupData): Promise<AuthUser> => {
    const response = await signup(data);
    if (response.success) {
      return response.data.user;
    }
    throw new Error(response.message);
  };

  const refreshUserHandler = async (): Promise<void> => {
    try {
      const response = await getCurrentUser();
      if (response.success) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  const googleAuthHandler = async (idToken: string): Promise<AuthUser> => {
    const response = await googleOAuth(idToken);
    if (response.success) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message);
  };

  const twitterAuthHandler = async (accessToken: string): Promise<AuthUser> => {
    const response = await twitterOAuth(accessToken);
    if (response.success) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message);
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
    twitterAuth: twitterAuthHandler,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
