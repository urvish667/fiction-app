"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { debounce } from "lodash"
import Link from "next/link"
import { motion } from "framer-motion"
import { logError } from "@/lib/error-logger"
import { useAuth } from "@/contexts/auth-context"
import { UserService } from "@/lib/api/user"
import { AuthLogo } from "./auth-logo"
import { GoogleLoginButton, DiscordLoginButton } from "./social-auth-buttons"
import type { SignupFormValues, UsernameAvailabilityState } from "../types/auth.types"

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams?.get("error")
  const { signup } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const [signupForm, setSignupForm] = useState<SignupFormValues>({
    email: "",
    username: "",
    password: "",
    birthdate: null,
    pronoun: "",
    termsAccepted: false,
    marketingOptIn: false,
  })

  const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailabilityState>({
    available: true,
    error: null,
    isChecking: false,
  })

  // Debounced username availability checker with guard clauses
  const checkUsernameAvailability = useCallback(
    debounce(async (username: string) => {
      if (!username || username.trim().length < 3) {
        setUsernameAvailability({ available: true, error: null, isChecking: false })
        return
      }

      setUsernameAvailability((prev) => ({ ...prev, isChecking: true }))

      try {
        const response = await UserService.checkUsername(username.trim())

        if (!response.success || !response.data) {
          setUsernameAvailability({
            available: false,
            error: response.message || "Error checking username availability",
            isChecking: false,
          })
          return
        }

        const isAvailable = Boolean(response.data.available)
        setUsernameAvailability({
          available: isAvailable,
          error: isAvailable ? null : "Username is already taken",
          isChecking: false,
        })

        if (!isAvailable) {
          setErrors((prev) => ({ ...prev, username: "Username is already taken" }))
          return
        }

        setErrors((prev) => {
          const next = { ...prev }
          delete next.username
          return next
        })
      } catch (err) {
        logError(err, { context: "Checking username availability" })
        setUsernameAvailability({
          available: false,
          error: "Error checking username availability",
          isChecking: false,
        })
      }
    }, 500),
    []
  )

  useEffect(() => {
    return () => {
      checkUsernameAvailability.cancel()
    }
  }, [checkUsernameAvailability])

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSignupForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }

    if (name === "username") {
      checkUsernameAvailability(value)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value ? new Date(e.target.value) : null
    setSignupForm((prev) => ({ ...prev, birthdate: dateValue }))

    if (errors.birthdate) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.birthdate
        return next
      })
    }
  }

  const handleSelectChange = (value: string) => {
    setSignupForm((prev) => ({ ...prev, pronoun: value }))
    if (errors.pronoun) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.pronoun
        return next
      })
    }
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setSignupForm((prev) => ({ ...prev, [name]: checked }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validateSignupForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!signupForm.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(signupForm.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!signupForm.username.trim()) {
      newErrors.username = "Username is required"
    } else if (signupForm.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    } else if (!usernameAvailability.available) {
      newErrors.username = usernameAvailability.error || "Username is not available"
    }

    if (!signupForm.password) {
      newErrors.password = "Password is required"
    } else if (signupForm.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!signupForm.birthdate) {
      newErrors.birthdate = "Birthdate is required"
    } else {
      const age = new Date().getFullYear() - signupForm.birthdate.getFullYear()
      if (age < 13) {
        newErrors.birthdate = "You must be at least 13 years old"
      }
    }

    if (!signupForm.pronoun) {
      newErrors.pronoun = "Please select your pronoun"
    }

    if (!signupForm.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isSubmitting) return
    if (!validateSignupForm()) return

    setIsSubmitting(true)

    try {
      await signup({
        email: signupForm.email.trim(),
        username: signupForm.username.trim(),
        password: signupForm.password,
        birthdate: signupForm.birthdate ? signupForm.birthdate.toISOString().split("T")[0] : "",
        pronoun: signupForm.pronoun,
        termsAccepted: signupForm.termsAccepted,
        marketingOptIn: Boolean(signupForm.marketingOptIn),
      })

      router.push(`/verify-email?email=${encodeURIComponent(signupForm.email.trim())}`)
    } catch (err: any) {
      logError(err, { context: "Signup error" })
      const errorMessage = err?.message || "An error occurred during signup"
      setErrors({ form: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!error) return

    const errorMap: Record<string, string> = {
      OAuthAccountNotLinked: "Email already in use with a different provider",
      OAuthSignin: "Error starting OAuth sign in",
      OAuthCallback: "Error during OAuth callback",
      OAuthCreateAccount: "Error creating OAuth account",
      EmailCreateAccount: "Error creating email account",
      Callback: "Error during callback",
      AccessDenied: "Access denied",
      Verification: "Email verification error",
    }

    const errorMessage = errorMap[error] || "An error occurred during sign up"
    setErrors({ form: errorMessage })
    logError(error, { context: "Authentication error" })
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
          <h2 className="text-2xl font-bold">Create an Account</h2>
          <p className="text-muted-foreground">Join our community of storytellers and readers</p>
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
                <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={signupForm.email}
                  onChange={handleSignupChange}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Username field */}
              <div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  name="username"
                  type="text"
                  placeholder="coolwriter123"
                  value={signupForm.username}
                  onChange={handleSignupChange}
                  disabled={isSubmitting}
                />
                {errors.username && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.username}
                  </p>
                )}
                {usernameAvailability.isChecking && (
                  <p className="text-xs text-muted-foreground">Checking availability...</p>
                )}
                {usernameAvailability.available && signupForm.username.length >= 3 && !errors.username && !usernameAvailability.isChecking && (
                  <p className="text-xs text-green-500">Username is available</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={signupForm.password}
                    onChange={handleSignupChange}
                    disabled={isSubmitting}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Birthdate field */}
              <div className="space-y-2">
                <Label htmlFor="signup-birthdate">Birthdate</Label>
                <div className="relative">
                  <Input
                    id="signup-birthdate"
                    type="date"
                    value={signupForm.birthdate ? format(signupForm.birthdate, "yyyy-MM-dd") : ""}
                    onChange={handleDateChange}
                    min={format(new Date(new Date().setFullYear(new Date().getFullYear() - 100)), "yyyy-MM-dd")}
                    max={format(new Date(new Date().setFullYear(new Date().getFullYear() - 13)), "yyyy-MM-dd")}
                    className="w-full"
                  />
                </div>
                {errors.birthdate && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.birthdate}
                  </p>
                )}
              </div>

              {/* Pronoun field */}
              <div className="space-y-2">
                <Label htmlFor="pronoun">Pronoun</Label>
                <Select
                  value={signupForm.pronoun}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger id="pronoun">
                    <SelectValue placeholder="Select your pronoun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="he/him">He/Him</SelectItem>
                    <SelectItem value="she/her">She/Her</SelectItem>
                    <SelectItem value="they/them">They/Them</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                {errors.pronoun && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.pronoun}
                  </p>
                )}
              </div>

              {/* Terms acceptance */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={signupForm.termsAccepted}
                    onCheckedChange={(checked) => handleCheckboxChange("termsAccepted", checked === true)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Button variant="link" className="p-0 h-auto text-xs" asChild>
                      <Link href="/terms" target="_blank">terms and conditions</Link>
                    </Button>
                    {" "}and{" "}
                    <Button variant="link" className="p-0 h-auto text-xs" asChild>
                      <Link href="/privacy" target="_blank">Privacy Policy</Link>
                    </Button>
                  </Label>
                </div>
                {errors.termsAccepted && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.termsAccepted}
                  </p>
                )}
              </div>

              {/* Marketing opt-in checkbox */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="marketing"
                    checked={signupForm.marketingOptIn}
                    onCheckedChange={(checked) => handleCheckboxChange("marketingOptIn", checked === true)}
                  />
                  <Label htmlFor="marketing" className="text-sm">
                    I&apos;d like to receive updates about new features, stories, and promotions from FableSpace
                  </Label>
                </div>
              </div>

              {/* General form error */}
              {errors.form && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3 w-3" />
                  {errors.form}
                </p>
              )}

              <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Login
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default SignupForm
