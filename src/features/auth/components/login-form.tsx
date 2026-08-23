"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { logError } from "@/lib/error-logger"
import { useAuth } from "@/contexts/auth-context"
import { AuthLogo } from "./auth-logo"
import { GoogleLoginButton, DiscordLoginButton } from "./social-auth-buttons"
import type { LoginFormValues } from "../types/auth.types"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/"
  const errorParam = searchParams?.get("error")
  const { login } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [loginForm, setLoginForm] = useState<LoginFormValues>({
    email: "",
    password: "",
    remember: false,
  })

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setLoginForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Guard: Clear error when user edits field
    if (errors[name]) {
      setErrors((prev) => {
        const nextErrors = { ...prev }
        delete nextErrors[name]
        return nextErrors
      })
    }
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!loginForm.email.trim()) {
      setErrors({ email: "Email is required" })
      return
    }

    if (!loginForm.password) {
      setErrors({ password: "Password is required" })
      return
    }

    setIsSubmitting(true)

    try {
      await login({
        email: loginForm.email,
        password: loginForm.password,
      })

      // Force full page refresh to ensure session and cookies sync cleanly
      window.location.href = callbackUrl
    } catch (error) {
      logError(error, { context: "Login error" })
      setErrors({ login: "Invalid email or password" })
      setIsSubmitting(false)
    }
  }

  // Handle URL errors
  useEffect(() => {
    if (!errorParam) return

    const errorMap: Record<string, string> = {
      CredentialsSignin: "Invalid email or password",
      OAuthAccountNotLinked: "Email already in use with a different provider",
      OAuthSignin: "Error starting OAuth sign in",
      OAuthCallback: "Error during OAuth callback",
      OAuthCreateAccount: "Error creating OAuth account",
      EmailCreateAccount: "Error creating email account",
      Callback: "Error during callback",
      AccessDenied: "Access denied",
      Verification: "Email verification error",
    }

    const message = errorMap[errorParam] || "An error occurred during sign in"
    setErrors({ login: message })
    logError(errorParam, { context: "Authentication error" })
  }, [errorParam])

  return (
    <div className="min-h-screen auth-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card rounded-lg shadow-xl border border-border p-6 space-y-6 w-full max-w-md backdrop-blur-sm bg-opacity-95"
      >
        <AuthLogo />
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                <GoogleLoginButton className="w-full" />
              )}
              <DiscordLoginButton className="w-full" />
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <Link
                    href="/reset-password/request"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    name="remember"
                    checked={loginForm.remember}
                    onCheckedChange={(checked) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        remember: checked === true,
                      }))
                    }
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Remember me
                  </Label>
                </div>
              </div>

              {errors.login && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.login}
                </p>
              )}

              <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default LoginForm
