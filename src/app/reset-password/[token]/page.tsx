"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, LockIcon } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import "../../auth-background.css"
import AuthLogo from "@/components/auth/logo"

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password/verify?token=${encodeURIComponent(token)}`)

        if (!response.ok) {
          setIsValidToken(false)
          setError("Invalid or expired reset link. Please request a new one.")
        }
      } catch (error) {
        console.error("Token verification error:", error)
        setIsValidToken(false)
        setError("An error occurred. Please try again.")
      }
    }

    if (token) {
      verifyToken()
    } else {
      setIsValidToken(false)
      setError("Invalid reset link. Please request a new one.")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords
    if (!password) {
      setError("Please enter a new password")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/auth/reset-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setError(data.error || "Failed to reset password. Please try again.")
      }
    } catch (error) {
      console.error("Password reset error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen auth-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <AuthLogo />
        <Card className="shadow-xl border border-border overflow-hidden w-full backdrop-blur-sm bg-opacity-95">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            {isValidToken && !isSuccess && "Enter your new password"}
            {!isValidToken && "Invalid Reset Link"}
            {isSuccess && "Password Reset Successful"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isValidToken && !isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setError("")
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              )}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          ) : isSuccess ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <p>Your password has been successfully reset!</p>
              <p className="text-sm text-muted-foreground">
                You will be redirected to the login page in a few seconds...
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <p className="text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">
                Please request a new password reset link.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" asChild>
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
      </div>
    </div>
  )
}
