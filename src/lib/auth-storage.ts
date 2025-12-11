import type { AuthUser } from '@/lib/api/auth';

const AUTH_STORAGE_KEY = 'fablespace_auth_user';
const AUTH_STORAGE_VERSION = '1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface AuthStorageData {
    user: AuthUser;
    timestamp: number;
    version: string;
}

/**
 * Check if we're in a browser environment
 */
const isBrowser = (): boolean => {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
};

/**
 * Save user data to localStorage
 * Only stores non-sensitive user profile data (NO tokens)
 */
export const saveAuthUser = (user: AuthUser): void => {
    if (!isBrowser()) return;

    try {
        const data: AuthStorageData = {
            user,
            timestamp: Date.now(),
            version: AUTH_STORAGE_VERSION,
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save auth user to localStorage:', error);
    }
};

/**
 * Get user data from localStorage
 * Returns null if data is invalid, expired, or doesn't exist
 */
export const getAuthUser = (): AuthUser | null => {
    if (!isBrowser()) return null;

    try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) return null;

        const data: AuthStorageData = JSON.parse(stored);

        // Validate version
        if (data.version !== AUTH_STORAGE_VERSION) {
            clearAuthUser();
            return null;
        }

        // Check if expired (24 hours)
        const isExpired = Date.now() - data.timestamp > CACHE_DURATION;
        if (isExpired) {
            clearAuthUser();
            return null;
        }

        // Validate user object has required fields
        if (!data.user || !data.user.id || !data.user.email) {
            clearAuthUser();
            return null;
        }

        return data.user;
    } catch (error) {
        console.error('Failed to get auth user from localStorage:', error);
        clearAuthUser();
        return null;
    }
};

/**
 * Clear user data from localStorage
 */
export const clearAuthUser = (): void => {
    if (!isBrowser()) return;

    try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear auth user from localStorage:', error);
    }
};

/**
 * Check if cached user data exists and is valid
 */
export const hasValidAuthCache = (): boolean => {
    return getAuthUser() !== null;
};
