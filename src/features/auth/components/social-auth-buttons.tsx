"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { GoogleIcon, DiscordIcon } from "@/components/common/social-icons"

export interface SocialButtonProps {
  text?: string
  className?: string
}

export function GoogleLoginButton({ text = "Google", className }: SocialButtonProps) {
  const { toast } = useToast()

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback/google`

    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Google client ID not configured",
      })
      return
    }

    const state = Math.random().toString(36).substring(7)
    sessionStorage.setItem("google_oauth_state", state)

    const searchParams = new URLSearchParams(window.location.search)
    const callbackUrl = searchParams.get("callbackUrl") || "/"
    sessionStorage.setItem("google_oauth_callback_url", callbackUrl)

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=openid%20email%20profile&state=${state}`
    window.location.href = authUrl
  }

  return (
    <Button
      variant="outline"
      type="button"
      className={`w-full bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${className || ""}`}
      onClick={handleGoogleLogin}
    >
      <GoogleIcon className="mr-2 h-4 w-4" />
      {text}
    </Button>
  )
}

export function DiscordLoginButton({ text = "Discord", className }: SocialButtonProps) {
  const { toast } = useToast()

  const handleDiscordLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || `${window.location.origin}/auth/callback/discord`

    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Discord client ID not configured",
      })
      return
    }

    const state = Math.random().toString(36).substring(7)
    sessionStorage.setItem("discord_oauth_state", state)

    const searchParams = new URLSearchParams(window.location.search)
    const callbackUrl = searchParams.get("callbackUrl") || "/"
    sessionStorage.setItem("discord_oauth_callback_url", callbackUrl)

    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=identify%20email&state=${state}`
    window.location.href = authUrl
  }

  return (
    <Button
      variant="outline"
      type="button"
      className={`w-full bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${className || ""}`}
      onClick={handleDiscordLogin}
    >
      <DiscordIcon className="mr-2 h-4 w-4" />
      {text}
    </Button>
  )
}

export function SocialAuthButtons({ googleText = "Google", discordText = "Discord", className }: { googleText?: string; discordText?: string; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className || ""}`}>
      <GoogleLoginButton text={googleText} />
      <DiscordLoginButton text={discordText} />
    </div>
  )
}
