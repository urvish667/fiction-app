"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { debounce } from "lodash"
import Link from "next/link"
import { motion } from "framer-motion"
import "../auth-background.css"
import AuthLogo from "@/components/auth/logo"
import { GoogleIcon, FacebookIcon } from "@/components/auth/social-icons"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/"

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
  const handleDateSelect = (date: Date | undefined) => {
    setSignupForm((prev) => ({ ...prev, birthdate: date || null }))
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
      console.error("Error checking username availability:", error)
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
        console.error("Signup error:", error)
        setErrors({ form: "An error occurred during signup" })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Handle OAuth signup
  const handleOAuthSignup = async (provider: "google" | "facebook") => {
    setIsSubmitting(true)

    try {
      await signIn(provider, { callbackUrl })
      // Note: This will redirect the page, so no need to set isSubmitting to false
    } catch (error) {
      console.error(`${provider} sign in error:`, error)
      setIsSubmitting(false)
    }
  }

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
                onClick={() => handleOAuthSignup("facebook")}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2"
              >
                <FacebookIcon className="text-blue-600" />
                <span>Facebook</span>
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
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={signupForm.password}
                  onChange={handleSignupChange}
                  disabled={isSubmitting}
                />
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
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !signupForm.birthdate && "text-muted-foreground"
                    }`}
                    type="button"
                    onClick={() => {
                      // Open date picker (simplified for this example)
                      const date = prompt("Enter your birthdate (YYYY-MM-DD)")
                      if (date) {
                        handleDateSelect(new Date(date))
                      }
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {signupForm.birthdate ? format(signupForm.birthdate, "PPP") : "Select your birthdate"}
                  </Button>
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
                    <Button variant="link" className="p-0 h-auto text-xs">
                      terms and conditions
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
