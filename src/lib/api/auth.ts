import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";

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

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface LoginResponse extends ApiResponse<{ user: AuthUser }> { }

export interface SignupResponse extends ApiResponse<{ user: AuthUser }> { }

export interface CurrentUserResponse extends ApiResponse<{ user: AuthUser }> { }

export interface LogoutResponse extends ApiResponse<void> { }

export interface OAuthResponse extends ApiResponse<{
    user: AuthUser;
    tokens?: {
        accessToken: string;
        refreshToken: string;
    };
}> { }

/**
 * Auth API service for interacting with authentication endpoints
 */
export const AuthService = {
    /**
     * Login with email and password
     */
    async login(data: LoginData): Promise<LoginResponse> {
        try {
            const response = await apiClient.post<LoginResponse>('/auth/login', data);
            return response;
        } catch (error: any) {
            logError(error.message || "Login failed", {
                context: 'Login',
                status: error.status,
                errorDetails: error
            });
            return {
                success: false,
                message: error.message || "Login failed"
            };
        }
    },

    /**
     * Logout current user
     */
    async logout(): Promise<LogoutResponse> {
        try {
            const response = await apiClient.post<LogoutResponse>('/auth/logout');
            return response;
        } catch (error: any) {
            logError(error.message || "Logout failed", {
                context: 'Logout',
                status: error.status,
                errorDetails: error
            });
            return {
                success: false,
                message: error.message || "Logout failed"
            };
        }
    },

    /**
     * Signup new user
     */
    async signup(data: SignupData): Promise<SignupResponse> {
        try {
            const response = await apiClient.post<SignupResponse>('/auth/signup', data);
            return response;
        } catch (error: any) {
            logError(error.message || "Signup failed", {
                context: 'Signup',
                status: error.status,
                errorDetails: error
            });
            return {
                success: false,
                message: error.message || "Signup failed"
            };
        }
    },

    /**
     * Get current authenticated user
     */
    async getCurrentUser(): Promise<CurrentUserResponse> {
        try {
            const response = await apiClient.get<CurrentUserResponse>('/auth/me');
            return response;
        } catch (error: any) {
            // Don't log 401 errors for getCurrentUser - it's expected when not logged in
            if (error.status !== 401) {
                logError(error.message || "Failed to get current user", {
                    context: 'Get current user',
                    status: error.status,
                    errorDetails: error
                });
            }
            return {
                success: false,
                message: error.message || "Failed to get current user"
            };
        }
    },

    /**
     * Refresh access token
     */
    async refreshToken(): Promise<ApiResponse<void>> {
        try {
            const response = await apiClient.post<ApiResponse<void>>('/auth/refresh');
            return response;
        } catch (error: any) {
            logError(error.message || "Token refresh failed", {
                context: 'Refresh token',
                status: error.status,
                errorDetails: error
            });
            return {
                success: false,
                message: error.message || "Token refresh failed"
            };
        }
    },

    /**
     * Authenticate with Google OAuth
     */
    async googleAuth(idToken?: string, accessToken?: string): Promise<OAuthResponse> {
        try {
            if (!idToken && !accessToken) {
                throw new Error('Either idToken or accessToken is required for Google authentication');
            }

            const response = await apiClient.post<OAuthResponse>('/auth/oauth/google', {
                idToken,
                accessToken
            });

            if (!response.success) {
                throw new Error(response.message || 'Google authentication failed');
            }

            return response;
        } catch (error: any) {
            logError(error.message || "Google authentication failed", {
                context: 'Google OAuth',
                status: error.status,
                errorDetails: error,
                hasIdToken: !!idToken,
                hasAccessToken: !!accessToken
            });

            return {
                success: false,
                message: error.message || "Google authentication failed"
            };
        }
    },

    /**
     * Authenticate with Discord OAuth
     */
    async discordAuth(accessToken: string): Promise<OAuthResponse> {
        try {
            if (!accessToken) {
                throw new Error('Access token is required for Discord authentication');
            }

            const response = await apiClient.post<OAuthResponse>('/auth/oauth/discord', {
                accessToken
            });

            if (!response.success) {
                throw new Error(response.message || 'Discord authentication failed');
            }

            return response;
        } catch (error: any) {
            logError(error.message || "Discord authentication failed", {
                context: 'Discord OAuth',
                status: error.status,
                errorDetails: error
            });

            return {
                success: false,
                message: error.message || "Discord authentication failed"
            };
        }
    },

    /**
     * Link OAuth account to current user
     */
    async linkOAuthAccount(
        provider: 'google' | 'twitter',
        providerId: string,
        accessToken?: string
    ): Promise<ApiResponse<void>> {
        try {
            const response = await apiClient.post<ApiResponse<void>>('/auth/oauth/link', {
                provider,
                providerId,
                accessToken
            });

            return response;
        } catch (error: any) {
            logError(error.message || "Failed to link OAuth account", {
                context: 'Link OAuth account',
                provider,
                status: error.status,
                errorDetails: error
            });

            return {
                success: false,
                message: error.message || "Failed to link OAuth account"
            };
        }
    },

    /**
     * Unlink OAuth account from current user
     */
    async unlinkOAuthAccount(provider: 'google' | 'twitter'): Promise<ApiResponse<void>> {
        try {
            const response = await apiClient.delete<ApiResponse<void>>('/auth/oauth/unlink', {
                data: { provider }
            });

            return response;
        } catch (error: any) {
            logError(error.message || "Failed to unlink OAuth account", {
                context: 'Unlink OAuth account',
                provider,
                status: error.status,
                errorDetails: error
            });

            return {
                success: false,
                message: error.message || "Failed to unlink OAuth account"
            };
        }
    },

    /**
     * Verify email with token
     */
    async verifyEmail(token: string): Promise<ApiResponse<{ user: AuthUser }>> {
        try {
            const response = await apiClient.post<ApiResponse<{ user: AuthUser }>>('/auth/verify-email', {
                token
            });

            return response;
        } catch (error: any) {
            logError(error.message || "Email verification failed", {
                context: 'Verify email',
                status: error.status,
                errorDetails: error
            });

            return {
                success: false,
                message: error.message || "Email verification failed"
            };
        }
    },

    /**
     * Resend verification email
     */
    async resendVerificationEmail(email: string): Promise<ApiResponse<void>> {
        try {
            const response = await apiClient.post<ApiResponse<void>>('/auth/resend-verification', {
                email
            });

            return response;
        } catch (error: any) {
            logError(error.message || "Failed to resend verification email", {
                context: 'Resend verification email',
                status: error.status,
                errorDetails: error
            });

            return {
                success: false,
                message: error.message || "Failed to resend verification email"
            };
        }
    },

    /**
     * Request password reset
     */
    async forgotPassword(email: string): Promise<ApiResponse<void>> {
        try {
            const response = await apiClient.post<ApiResponse<void>>('/auth/forgot-password', {
                email
            });

            return response;
        } catch (error: any) {
            logError(error.message || "Failed to request password reset", {
                context: 'Forgot password',
                status: error.status,
                errorDetails: error
            });

            return {
                success: false,
                message: error.message || "Failed to request password reset"
            };
        }
    },

    /**
     * Reset password with token
     */
    async resetPassword(token: string, password: string): Promise<ApiResponse<void>> {
        try {
            const response = await apiClient.post<ApiResponse<void>>('/auth/reset-password', {
                token,
                password
            });

            return response;
        } catch (error: any) {
            logError(error.message || "Password reset failed", {
                context: 'Reset password',
                status: error.status,
                errorDetails: error
            });

            return {
                success: false,
                message: error.message || "Password reset failed"
            };
        }
    }
};
