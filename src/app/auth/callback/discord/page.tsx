'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from 'lucide-react';

export default function DiscordCallbackPage() {
    const router = useRouter();
    const { discordAuth } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(true);

    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const handleCallback = async () => {
            // Parse hash parameters (implicit flow returns token in hash)
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const state = params.get('state');
            const error = params.get('error');

            // Verify state
            const savedState = sessionStorage.getItem('discord_oauth_state');
            sessionStorage.removeItem('discord_oauth_state'); // Clear state

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Login Failed",
                    description: "Discord login failed",
                });
                router.push('/login');
                return;
            }

            if (!accessToken) {
                toast({
                    variant: "destructive",
                    title: "Login Failed",
                    description: "No access token received",
                });
                router.push('/login');
                return;
            }

            if (state !== savedState) {
                toast({
                    variant: "destructive",
                    title: "Security Error",
                    description: "Invalid state parameter",
                });
                router.push('/login');
                return;
            }

            try {
                const user = await discordAuth(accessToken);
                toast({
                    title: "Success",
                    description: "Successfully logged in with Discord",
                });

                if (user.isProfileComplete === false) {
                    router.push('/complete-profile');
                } else {
                    const callbackUrl = sessionStorage.getItem('discord_oauth_callback_url') || '/';
                    sessionStorage.removeItem('discord_oauth_callback_url');
                    router.push(callbackUrl);
                }
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Authentication Failed",
                    description: error.message || 'Failed to authenticate with Discord',
                });
                router.push('/login');
            } finally {
                setIsProcessing(false);
            }
        };

        handleCallback();
    }, [router, discordAuth, toast]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Authenticating with Discord...</p>
            </div>
        </div>
    );
}
