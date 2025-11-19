import { apiClient } from './apiClient';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name?: string;
  image?: string;
  birthdate?: string;
  emailVerified?: Date | null;
  preferences?: any;
  bannerImage?: string | null;
  isProfileComplete?: boolean;
  unreadNotifications?: number;
  marketingOptIn?: boolean;
  provider?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  username: string;
  password: string;
  birthdate: string;
  pronoun: string;
  termsAccepted: boolean;
  marketingOptIn: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data: {
    user: Omit<AuthUser, 'emailVerified'>;
  };
}

export interface CurrentUserResponse {
  success: boolean;
  data: {
    user: AuthUser;
  };
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface OAuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    tokens?: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export const login = async (data: LoginData): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/auth/login', data);
};

export const logout = async (): Promise<LogoutResponse> => {
  return apiClient.post<LogoutResponse>('/auth/logout');
};

export const signup = async (data: SignupData): Promise<SignupResponse> => {
  return apiClient.post<SignupResponse>('/auth/signup', data);
};

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  return apiClient.get<CurrentUserResponse>('/auth/me');
};

export const refreshToken = async (): Promise<{ success: boolean; message: string }> => {
  return apiClient.post<{ success: boolean; message: string }>('/auth/refresh');
};

export const googleOAuth = async (idToken: string): Promise<OAuthResponse> => {
  return apiClient.post<OAuthResponse>('/auth/oauth/google', { idToken });
};

export const twitterOAuth = async (accessToken: string): Promise<OAuthResponse> => {
  return apiClient.post<OAuthResponse>('/auth/oauth/twitter', { accessToken });
};

export const verifyEmail = async (token: string): Promise<{ success: boolean; message: string; data: { user: AuthUser } }> => {
  return apiClient.post<{ success: boolean; message: string; data: { user: AuthUser } }>('/auth/verify-email', { token });
};

export const resendVerificationEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
  return apiClient.post<{ success: boolean; message: string }>('/auth/resend-verification', { email });
};

export const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
  return apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });
};

export const resetPassword = async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
  return apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', { token, password });
};
