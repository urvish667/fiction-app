"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useRequireAuth } from "../hooks/use-require-auth"
import { UserService } from "@/lib/api/user"
import { debounce } from "lodash"
import Link from "next/link"
import { AuthLogo } from "./auth-logo"
import { logError } from "@/lib/error-logger"
import type { CompleteProfileFormValues, UsernameAvailabilityState } from "../types/auth.types"

export function CompleteProfileForm() {
  const router = useRouter()
  const { user } = useRequireAuth()
  const { refreshUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [callbackUrl, setCallbackUrl] = useState<string>("/")

  const [formData, setFormData] = useState<CompleteProfileFormValues>({
    username: "",
    birthdate: null,
    pronoun: "",
    termsAccepted: false,
  })

  const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailabilityState>({
    available: true,
    error: null,
    isChecking: false,
  })

  // Guard: Redirect if already complete
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const callback = urlParams.get("callbackUrl") || "/"
    setCallbackUrl(callback)

    if (user?.isProfileComplete) {
      router.push(callback)
    }
  }, [user, router])

  const checkUsernameAvailability = useCallback(
    debounce(async (username: string) => {
      if (!username || username.trim().length < 3) return

      setUsernameAvailability((prev) => ({ ...prev, isChecking: true }))

      try {
        const response = await UserService.checkUsername(username.trim())
        const isAvailable = Boolean(response.success && response.data?.available)

        setUsernameAvailability({
          available: isAvailable,
          error: isAvailable ? null : response.message || "Username not available",
          isChecking: false,
        })

        if (!isAvailable) {
          setErrors((prev) => ({ ...prev, username: response.message || "Username not available" }))
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
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

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, pronoun: value }))
    if (errors.pronoun) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.pronoun
        return next
      })
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null
    setFormData((prev) => ({ ...prev, birthdate: date }))
    if (errors.birthdate) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.birthdate
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isSubmitting) return

    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    } else if (!usernameAvailability.available) {
      newErrors.username = usernameAvailability.error || "Username is not available"
    }

    if (!formData.birthdate) {
      newErrors.birthdate = "Birthdate is required"
    } else {
      const age = new Date().getFullYear() - formData.birthdate.getFullYear()
      if (age < 13) {
        newErrors.birthdate = "You must be at least 13 years old"
      }
    }

    if (!formData.pronoun) {
      newErrors.pronoun = "Please select your pronoun"
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms and conditions"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsSubmitting(true)

    try {
      const response = await UserService.completeProfile({
        username: formData.username.trim(),
        birthdate: formData.birthdate ? formData.birthdate.toISOString().split("T")[0] : "",
        pronoun: formData.pronoun,
        termsAccepted: formData.termsAccepted,
      })

      if (!response.success) {
        setErrors({ form: response.message || "An error occurred" })
        return
      }

      if (refreshUser) {
        await refreshUser()
      }
      await new Promise((resolve) => setTimeout(resolve, 200))
      window.location.href = callbackUrl
    } catch (err) {
      logError(err, { context: "Completing profile" })
      setErrors({ form: "An error occurred while completing your profile" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen auth-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border border-border overflow-hidden w-full backdrop-blur-sm bg-opacity-95">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <AuthLogo />
              </div>
              <CardTitle className="text-2xl font-bold text-center">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen auth-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border border-border overflow-hidden w-full backdrop-blur-sm bg-opacity-95">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AuthLogo />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
            <CardDescription className="text-center">
              Please provide a few more details to complete your account setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username field */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="coolwriter123"
                  value={formData.username}
                  onChange={handleChange}
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
                {usernameAvailability.available && formData.username.length >= 3 && !errors.username && !usernameAvailability.isChecking && (
                  <p className="text-xs text-green-500">Username is available</p>
                )}
              </div>

              {/* Birthdate field */}
              <div className="space-y-2">
                <Label htmlFor="birthdate">Birthdate</Label>
                <div className="relative">
                  <Input
                    id="birthdate"
                    type="date"
                    value={formData.birthdate ? format(formData.birthdate, "yyyy-MM-dd") : ""}
                    onChange={handleDateChange}
                    min={format(new Date(new Date().setFullYear(new Date().getFullYear() - 100)), "yyyy-MM-dd")}
                    max={format(new Date(new Date().setFullYear(new Date().getFullYear() - 13)), "yyyy-MM-dd")}
                    className="w-full"
                    disabled={isSubmitting}
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
                  value={formData.pronoun}
                  onValueChange={handleSelectChange}
                  disabled={isSubmitting}
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
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, termsAccepted: checked === true }))
                    }
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Button variant="link" className="p-0 h-auto text-xs" asChild>
                      <Link href="/terms" target="_blank">
                        terms and conditions
                      </Link>
                    </Button>{" "}
                    and{" "}
                    <Button variant="link" className="p-0 h-auto text-xs" asChild>
                      <Link href="/privacy" target="_blank">
                        Privacy Policy
                      </Link>
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
                    Completing Profile...
                  </>
                ) : (
                  "Complete Profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CompleteProfileForm
