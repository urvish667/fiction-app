"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import "../auth-background.css"
import AuthLogo from "@/components/auth/logo"
import { logError } from "@/lib/error-logger"
import { useAuth } from "@/lib/auth-context"
import { GoogleLoginButton } from "@/components/auth/google-login-button"
import { DiscordLoginButton } from "@/components/auth/discord-login-button"

// Component that uses searchParams
function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/"
  const error = searchParams?.get("error")
  const { login } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    remember: false,
  })

  // Handle input change
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setLoginForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await login({
        email: loginForm.email,
        password: loginForm.password,
      })

      // Force full page refresh to ensure auth state is available
      window.location.href = callbackUrl
    } catch (error) {
      logError(error, { context: 'Login error' })
      setErrors({ login: "Invalid email or password" })
      setIsSubmitting(false)
    }
  }

  // Set error from URL parameter with improved error handling
  useEffect(() => {
    if (error) {
      // Handle specific error types
      let errorMessage = "An error occurred during sign in";

      switch (error) {
        case "CredentialsSignin":
          errorMessage = "Invalid email or password";
          break;
        case "OAuthAccountNotLinked":
          errorMessage = "Email already in use with a different provider";
          break;
        case "OAuthSignin":
          errorMessage = "Error starting OAuth sign in";
          break;
        case "OAuthCallback":
          errorMessage = "Error during OAuth callback";
          break;
        case "OAuthCreateAccount":
          errorMessage = "Error creating OAuth account";
          break;
        case "EmailCreateAccount":
          errorMessage = "Error creating email account";
          break;
        case "Callback":
          errorMessage = "Error during callback";
          break;
        case "AccessDenied":
          errorMessage = "Access denied";
          break;
        case "Verification":
          errorMessage = "Email verification error";
          break;
      }

      setErrors({ login: errorMessage });

      // Log the error for debugging
      logError(error, { context: 'Authentication error' })
    }
  }, [error])

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
          <p className="text-muted-foreground">Sign in to continue your journey</p>
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
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email or Username</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="text"
                  placeholder="your@email.com"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <Link
                    href="/reset-password/request"
                    className="text-xs text-muted-foreground hover:text-primary"
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
              </div>

              {errors.login && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.login}
                </p>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  name="remember"
                  checked={loginForm.remember}
                  onCheckedChange={(checked) => setLoginForm((prev) => ({ ...prev, remember: checked === true }))}
                  disabled={isSubmitting}
                />
                <Label htmlFor="remember" className="text-sm">
                  Remember me
                </Label>
              </div>

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Don't have an account?{" "}
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

// Main component that wraps the LoginContent in a Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen auth-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-lg shadow-xl border border-border p-6 space-y-6 w-full max-w-md backdrop-blur-sm bg-opacity-95">
          <div className="flex justify-center">
            <AuthLogo />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">Loading...</h2>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
