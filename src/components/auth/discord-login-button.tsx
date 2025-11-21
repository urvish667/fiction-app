import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast"
import { DiscordIcon } from '@/components/auth/social-icons';

interface DiscordLoginButtonProps {
    text?: string;
    className?: string;
}

export function DiscordLoginButton({ text = 'Discord', className }: DiscordLoginButtonProps) {
    const { toast } = useToast()

    const handleDiscordLogin = () => {
        const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || `${window.location.origin}/auth/callback/discord`;

        if (!clientId) {
            toast({
                variant: "destructive",
                title: "Configuration Error",
                description: "Discord client ID not configured",
            })
            return;
        }

        // Generate random state for security
        const state = Math.random().toString(36).substring(7);
        sessionStorage.setItem('discord_oauth_state', state);

        // Save callback URL if present
        const searchParams = new URLSearchParams(window.location.search);
        const callbackUrl = searchParams.get('callbackUrl') || '/';
        sessionStorage.setItem('discord_oauth_callback_url', callbackUrl);

        // Discord OAuth URL
        // Using 'token' response type for implicit flow to get access token directly
        // Scopes: identify email
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=identify%20email&state=${state}`;

        window.location.href = authUrl;
    };

    return (
        <Button
            variant="outline"
            type="button"
            className={`w-full bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${className}`}
            onClick={handleDiscordLogin}
        >
            <DiscordIcon className="mr-2 h-4 w-4" />
            {text}
        </Button>
    );
}
