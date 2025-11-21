"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast"
import { GoogleIcon } from '@/components/auth/social-icons';

interface GoogleLoginButtonProps {
    text?: string;
    className?: string;
}

export function GoogleLoginButton({ text = 'Google', className }: GoogleLoginButtonProps) {
    const { toast } = useToast()

    const handleGoogleLogin = () => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback/google`;

        if (!clientId) {
            toast({
                variant: "destructive",
                title: "Configuration Error",
                description: "Google client ID not configured",
            })
            return;
        }

        // Generate random state for security
        const state = Math.random().toString(36).substring(7);
        sessionStorage.setItem('google_oauth_state', state);

        // Save callback URL if present
        const searchParams = new URLSearchParams(window.location.search);
        const callbackUrl = searchParams.get('callbackUrl') || '/';
        sessionStorage.setItem('google_oauth_callback_url', callbackUrl);

        // Google OAuth URL with implicit flow (token response type)
        // This will redirect to Google's OAuth page in the same window (no popup)
        // Scopes: openid email profile
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=openid%20email%20profile&state=${state}`;

        window.location.href = authUrl;
    };

    return (
        <Button
            variant="outline"
            type="button"
            className={`w-full bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${className}`}
            onClick={handleGoogleLogin}
        >
            <GoogleIcon className="mr-2 h-4 w-4" />
            {text}
        </Button>
    );
}
