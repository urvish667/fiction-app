"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, MailIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import "../auth-background.css"
import AuthLogo from "@/components/auth/logo"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams?.get("email") || ""
  const token = searchParams?.get("token") || ""

  const [verificationState, setVerificationState] = useState<"initial" | "verifying" | "success" | "error">("initial")
  const [errorMessage, setErrorMessage] = useState("")
  const [isResending, setIsResending] = useState(false)

  // Verify token if present
  useEffect(() => {
    if (token) {
      verifyToken(token)
    }
  }, [token])

  // Function to verify token
  const verifyToken = async (token: string) => {
    setVerificationState("verifying")

    try {
      const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      const data = await response.json()

      if (response.ok) {
        setVerificationState("success")

        // No need to update session here since the user isn't logged in yet
        // The email verification has already been recorded in the database
        // When the user logs in, they'll get a token with the updated emailVerified status

        // Always redirect to login page after email verification
        setTimeout(() => {
          // Store the callback URL in the login redirect if provided
          const callbackUrl = searchParams?.get("callbackUrl")
          const loginUrl = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login'
          router.push(loginUrl)
        }, 3000)
      } else {
        setVerificationState("error")
        setErrorMessage(data.error || "Verification failed. Please try again.")
      }
    } catch (error) {
      console.error("Verification error:", error)
      setVerificationState("error")
      setErrorMessage("An error occurred during verification. Please try again.")
    }
  }

  // Function to resend verification email
  const handleResendVerification = async () => {
    if (!email) {
      setErrorMessage("Email address is missing. Please try signing up again.")
      return
    }

    setIsResending(true)

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        // Show success message
        alert("Verification email has been resent. Please check your inbox.")
      } else {
        setErrorMessage(data.error || "Failed to resend verification email. Please try again.")
      }
    } catch (error) {
      console.error("Resend verification error:", error)
      setErrorMessage("An error occurred. Please try again.")
    } finally {
      setIsResending(false)
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
          <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {verificationState === "initial" && "Please verify your email address to continue"}
            {verificationState === "verifying" && "Verifying your email..."}
            {verificationState === "success" && "Your email has been verified!"}
            {verificationState === "error" && "Verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationState === "initial" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <MailIcon className="h-12 w-12 text-primary" />
              </div>
              <p>
                We've sent a verification email to <strong>{email}</strong>.
                Please check your inbox and click the verification link to activate your account.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't see the email, check your spam folder or click the button below to resend.
              </p>
            </div>
          )}

          {verificationState === "verifying" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p>Please wait while we verify your email address...</p>
            </div>
          )}

          {verificationState === "success" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <p>Your email has been successfully verified!</p>
              <p className="text-sm text-muted-foreground">
                You will be redirected to the login page in a few seconds...
              </p>
            </div>
          )}

          {verificationState === "error" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <p className="text-destructive">{errorMessage}</p>
              <p className="text-sm text-muted-foreground">
                Please try again or contact support if the problem persists.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {verificationState === "initial" && (
            <Button
              className="w-full"
              onClick={handleResendVerification}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
          )}

          {verificationState === "error" && (
            <Button
              className="w-full"
              onClick={handleResendVerification}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
          )}

          <Button variant="outline" className="w-full" asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
      </div>
    </div>
  )
}
