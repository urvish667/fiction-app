"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { debounce } from "lodash"
import Link from "next/link"
import { motion } from "framer-motion"
import "../auth-background.css"
import AuthLogo from "@/components/auth/logo"
import { GoogleIcon, XIcon } from "@/components/auth/social-icons"
import { logError } from "@/lib/error-logger"

// Component that uses searchParams
function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/"
  const error = searchParams?.get("error")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [signupForm, setSignupForm] = useState({
    email: "",
    username: "",
    password: "",
    birthdate: null as Date | null,
    pronoun: "",
    termsAccepted: false,
    marketingOptIn: false,
  })

  const [usernameAvailability, setUsernameAvailability] = useState<{
    available: boolean;
    error: string | null;
    isChecking: boolean;
  }>({
    available: true,
    error: null,
    isChecking: false,
  })

  const [showPassword, setShowPassword] = useState(false)

  // Handle input change
  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSignupForm((prev) => ({
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

    // Check username availability
    if (name === "username") {
      checkUsernameAvailability(value)
    }
  }

  // Handle select change
  const handleSelectChange = (value: string) => {
    setSignupForm((prev) => ({ ...prev, pronoun: value }))
    if (errors.pronoun) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.pronoun
        return newErrors
      })
    }
  }

  // Handle checkbox change
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setSignupForm((prev) => ({ ...prev, [name]: checked }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null
    setSignupForm((prev) => ({ ...prev, birthdate: date }))
    if (errors.birthdate) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.birthdate
        return newErrors
      })
    }
  }

  // Check username availability with debounce
  const checkUsernameAvailability = debounce(async (username: string) => {
    if (!username || username.length < 3) {
      return
    }

    setUsernameAvailability((prev) => ({ ...prev, isChecking: true }))

    try {
      const response = await fetch(`/api/auth/username-check?username=${encodeURIComponent(username)}`)
      const data = await response.json()

      setUsernameAvailability({
        available: data.available,
        error: data.error,
        isChecking: false,
      })

      if (!data.available && data.error) {
        setErrors((prev) => ({ ...prev, username: data.error }))
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.username
          return newErrors
        })
      }
    } catch (error) {
      logError(error, { context: 'Checking username availability' })
      setUsernameAvailability({
        available: false,
        error: "Error checking username availability",
        isChecking: false,
      })
    }
  }, 500)

  // Validate form
  const validateSignupForm = () => {
    const newErrors: Record<string, string> = {}

    if (!signupForm.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(signupForm.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!signupForm.username) {
      newErrors.username = "Username is required"
    } else if (signupForm.username.length < 3) {
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

  // Handle signup submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateSignupForm()) {
      setIsSubmitting(true)

      try {
        // Submit signup data to the API
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: signupForm.email,
            username: signupForm.username,
            password: signupForm.password,
            birthdate: signupForm.birthdate ? signupForm.birthdate.toISOString().split("T")[0] : "",
            pronoun: signupForm.pronoun,
            termsAccepted: signupForm.termsAccepted,
            marketingOptIn: signupForm.marketingOptIn,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.error) {
            setErrors({ form: data.error })
          } else {
            setErrors({ form: "An error occurred during signup" })
          }
        } else {
          // Redirect to verification page
          router.push("/verify-email?email=" + encodeURIComponent(signupForm.email))
        }
      } catch (error) {
        logError(error, { context: 'Signup error' })
        setErrors({ form: "An error occurred during signup" })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Handle OAuth signup with improved error handling
  const handleOAuthSignup = async (provider: "google" | "twitter") => {
    setIsSubmitting(true)

    try {
      // Add state parameter for CSRF protection
      await signIn(provider, {
        callbackUrl,
        redirect: true,
      })
      // Note: This will redirect the page, so no need to set isSubmitting to false
    } catch (error) {
      logError(error, { context: 'OAuth signup error', provider })
      setErrors({ form: `Error signing in with ${provider}. Please try again.` })
      setIsSubmitting(false)
    }
  }

  // Set error from URL parameter with improved error handling
  useEffect(() => {
    if (error) {
      // Handle specific error types
      let errorMessage = "An error occurred during sign up";

      switch (error) {
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

      setErrors({ form: errorMessage });

      // Log the error for debugging
      logError(error, { context: 'Authentication error' })
    }
  }, [error])

  // Clear username availability check when component unmounts
  useEffect(() => {
    return () => {
      checkUsernameAvailability.cancel()
    }
  }, [checkUsernameAvailability])

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
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOAuthSignup("google")}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2"
              >
                <GoogleIcon />
                <span>Google</span>
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOAuthSignup("twitter")}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2"
              >
                <XIcon className="text-black dark:text-white" />
                <span>X</span>
              </Button>
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
                    I'd like to receive updates about new features, stories, and promotions from FableSpace
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
                {isSubmitting ? "Creating Account..." : "Create Account"}
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

// Main component that wraps the SignupContent in a Suspense boundary
export default function SignupPage() {
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
      <SignupContent />
    </Suspense>
  )
}
