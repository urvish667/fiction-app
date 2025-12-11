'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook to protect routes that require authentication.
 * Checks authentication status on mount and redirects to login page
 * if the user is not authenticated.
 * 
 * @returns Object containing user, isLoading, and isAuthenticated states
 */
export function useRequireAuth() {
    const { user, isLoading, checkAuth } = useAuth();
    const router = useRouter();
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        const verifyAuth = async () => {
            if (hasChecked) return;

            // If user already exists in context (e.g., from OAuth callback),
            // no need to call the API again
            if (user) {
                setHasChecked(true);
                return;
            }

            const isAuthenticated = await checkAuth();
            setHasChecked(true);

            if (!isAuthenticated) {
                const currentPath = window.location.pathname + window.location.search;
                router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
            }
        };

        verifyAuth();
    }, [user, checkAuth, hasChecked, router]);

    return {
        user,
        isLoading: isLoading || !hasChecked,
        isAuthenticated: !!user,
    };
}
