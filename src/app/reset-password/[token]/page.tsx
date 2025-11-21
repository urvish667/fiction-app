"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import "../../auth-background.css"
import AuthLogo from "@/components/auth/logo"
import { logError } from "@/lib/error-logger"
import { AuthService } from "@/lib/api/auth"

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

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

    if (!token) {
      setError("Invalid reset link. Please request a new one.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await AuthService.resetPassword(token, password)

      if (response.success) {
        setIsSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setError(response.message || "Failed to reset password. Please try again.")
      }
    } catch (error: any) {
      logError(error, { context: 'Resetting password' })
      setError(error.message || "An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen auth-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border border-border overflow-hidden w-full backdrop-blur-sm bg-opacity-95">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AuthLogo />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              {!isSuccess && "Enter your new password"}
              {isSuccess && "Password Reset Successful"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSuccess ? (
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <p>Your password has been successfully reset!</p>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to the login page in a few seconds...
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
