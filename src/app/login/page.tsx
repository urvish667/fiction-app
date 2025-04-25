"use client"

import { useState, useEffect, Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import "../auth-background.css"
import AuthLogo from "@/components/auth/logo"
import { GoogleIcon, FacebookIcon } from "@/components/auth/social-icons"

// Component that uses searchParams
function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/"
  const error = searchParams?.get("error")

  const [activeTab, setActiveTab] = useState("login")
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
      const result = await signIn("credentials", {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false,
      })

      if (result?.error) {
        setErrors({ login: "Invalid email or password" })
      } else {
        // Successfully logged in
        router.push(callbackUrl)
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrors({ login: "An error occurred while logging in" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle OAuth login
  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setIsSubmitting(true)

    try {
      await signIn(provider, { callbackUrl })
      // Note: This will redirect the page, so no need to set isSubmitting to false
    } catch (error) {
      console.error(`${provider} sign in error:`, error)
      setIsSubmitting(false)
    }
  }

  // Set error from URL parameter
  useEffect(() => {
    if (error) {
      setErrors({ login: error === "CredentialsSignin"
        ? "Invalid email or password"
        : "An error occurred during sign in"
      })
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

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Login Tab */}
              {activeTab === "login" && (
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin}>
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
                    <div className="space-y-2 mt-4">
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
                      <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                        <AlertCircle className="h-3 w-3" />
                        {errors.login}
                      </p>
                    )}

                    <div className="flex items-center space-x-2 mt-4">
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
                    <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Logging in..." : "Login"}
                    </Button>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => handleOAuthLogin("google")}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2"
                      >
                        <GoogleIcon />
                        <span>Google</span>
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => handleOAuthLogin("facebook")}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2"
                      >
                        <FacebookIcon className="text-blue-600" />
                        <span>Facebook</span>
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              )}

              {/* Signup Tab */}
              {activeTab === "signup" && (
                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-4">
                    <p className="text-sm text-center">
                      Create a new account to start sharing your stories
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => router.push("/signup")}
                    >
                      Create Account
                    </Button>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => handleOAuthLogin("google")}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2"
                      >
                        <GoogleIcon />
                        <span>Google</span>
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => handleOAuthLogin("facebook")}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2"
                      >
                        <FacebookIcon className="text-blue-600" />
                        <span>Facebook</span>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
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
