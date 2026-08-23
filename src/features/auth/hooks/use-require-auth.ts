'use client';

import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook to protect routes that require authentication.
 * Checks authentication status on mount and redirects to login page
 * if the user is not authenticated.
 */
export function useRequireAuth() {
    const { user, isLoading, checkAuth } = useAuth();
    const router = useRouter();
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        const verifyAuth = async () => {
            if (hasChecked) return;
            if (isLoading) return;

            // Guard: If user already exists in context, no need to call API again
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
    }, [user, isLoading, checkAuth, hasChecked, router]);

    return {
        user,
        isLoading: isLoading || !hasChecked,
        isAuthenticated: Boolean(user),
    };
}

export default useRequireAuth;
