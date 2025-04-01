"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarIcon, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: () => void
}

type SignupStep = "initial" | "details"
type SignupMethod = "email" | "google" | "facebook" | null

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState("login")
  const [signupStep, setSignupStep] = useState<SignupStep>("initial")
  const [signupMethod, setSignupMethod] = useState<SignupMethod>(null)

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    remember: false,
  })

  const [signupForm, setSignupForm] = useState({
    email: "",
    username: "",
    password: "",
    birthdate: null as Date | null,
    pronoun: "",
    termsAccepted: false,
    marketingOptIn: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Handle login form change
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setLoginForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Handle signup form change
  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSignupForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // Handle select change
  const handleSelectChange = (value: string) => {
    setSignupForm((prev) => ({ ...prev, pronoun: value }))
    if (errors.pronoun) {
      setErrors((prev) => ({ ...prev, pronoun: "" }))
    }
  }

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setSignupForm((prev) => ({ ...prev, birthdate: date }))
    if (errors.birthdate) {
      setErrors((prev) => ({ ...prev, birthdate: "" }))
    }
  }

  // Handle checkbox change
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setSignupForm((prev) => ({ ...prev, [name]: checked }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // Handle login submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically validate and submit the login credentials
    onLogin()
  }

  // Handle OAuth signup
  const handleOAuthSignup = (provider: "google" | "facebook") => {
    // In a real implementation, this would trigger the OAuth flow
    // For now, we'll simulate a successful OAuth login and move to the next step
    setSignupMethod(provider)
    setSignupStep("details")

    // Simulate getting email from OAuth provider
    if (provider === "google") {
      setSignupForm((prev) => ({ ...prev, email: "user@gmail.com" }))
    } else {
      setSignupForm((prev) => ({ ...prev, email: "user@facebook.com" }))
    }
  }

  // Handle email signup initial step
  const handleEmailSignupStart = () => {
    setSignupMethod("email")
    setSignupStep("details")
  }

  // Validate signup form
  const validateSignupForm = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!signupForm.email && signupMethod === "email") {
      newErrors.email = "Email is required"
    } else if (signupMethod === "email" && !/\S+@\S+\.\S+/.test(signupForm.email)) {
      newErrors.email = "Please enter a valid email"
    }

    // Username validation
    if (!signupForm.username) {
      newErrors.username = "Username is required"
    } else if (signupForm.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    }

    // Password validation (only for email signup)
    if (signupMethod === "email") {
      if (!signupForm.password) {
        newErrors.password = "Password is required"
      } else if (signupForm.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters"
      }
    }

    // Birthdate validation
    if (!signupForm.birthdate) {
      newErrors.birthdate = "Birthdate is required"
    } else {
      const age = new Date().getFullYear() - signupForm.birthdate.getFullYear()
      if (age < 13) {
        newErrors.birthdate = "You must be at least 13 years old"
      }
    }

    // Pronoun validation
    if (!signupForm.pronoun) {
      newErrors.pronoun = "Please select your pronoun"
    }

    // Terms acceptance
    if (!signupForm.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle signup submission
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateSignupForm()) {
      // Here you would typically submit the signup data
      console.log("Signup form submitted:", signupForm)
      onLogin()
    }
  }

  // Reset the form when modal is closed
  const handleClose = () => {
    setActiveTab("login")
    setSignupStep("initial")
    setSignupMethod(null)
    setSignupForm({
      email: "",
      username: "",
      password: "",
      birthdate: null,
      pronoun: "",
      termsAccepted: false,
      marketingOptIn: false,
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Welcome to FableSpace</DialogTitle>
          <DialogDescription className="text-center">Join our community of storytellers and readers</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${signupStep}-${signupMethod}`}
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
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <Button variant="link" className="p-0 h-auto text-xs">
                          Forgot password?
                        </Button>
                      </div>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <Checkbox
                        id="remember"
                        name="remember"
                        checked={loginForm.remember}
                        onCheckedChange={(checked) => setLoginForm((prev) => ({ ...prev, remember: checked === true }))}
                      />
                      <Label htmlFor="remember" className="text-sm">
                        Remember me
                      </Label>
                    </div>
                    <Button className="w-full mt-4" type="submit">
                      Login
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
                        className="flex items-center justify-center gap-2"
                        onClick={() => onLogin()} // In a real app, this would trigger Google OAuth
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M8 12 h8"></path>
                          <path d="M12 8 v8"></path>
                        </svg>
                        Google
                      </Button>

                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                        onClick={() => onLogin()} // In a real app, this would trigger Facebook OAuth
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                        Facebook
                      </Button>
                    </div>
                  </form>
                  <div className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("signup")}>
                      Sign up
                    </Button>
                  </div>
                </TabsContent>
              )}

              {/* Signup Tab - Initial Step */}
              {activeTab === "signup" && signupStep === "initial" && (
                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleOAuthSignup("google")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 12 h8"></path>
                        <path d="M12 8 v8"></path>
                      </svg>
                      Continue with Google
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleOAuthSignup("facebook")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                      Continue with Facebook
                    </Button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    <Button className="w-full" onClick={handleEmailSignupStart}>
                      Sign up with Email
                    </Button>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("login")}>
                      Login
                    </Button>
                  </div>
                </TabsContent>
              )}

              {/* Signup Tab - Details Step */}
              {activeTab === "signup" && signupStep === "details" && (
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignupSubmit}>
                    {/* Email field (only shown for email signup) */}
                    {signupMethod === "email" && (
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="your@email.com"
                          value={signupForm.email}
                          onChange={handleSignupChange}
                        />
                        {errors.email && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.email}
                          </p>
                        )}
                        {/* Email validation annotation */}
                        {signupForm.email && !errors.email && (
                          <p className="text-xs text-muted-foreground">
                            {/* This is where email validation logic would be implemented */}
                            {signupForm.email.includes("gmail.com") ||
                            signupForm.email.includes("yahoo.com") ||
                            signupForm.email.includes("outlook.com")
                              ? "Valid email domain"
                              : "Note: Consider using a major email provider"}
                          </p>
                        )}
                      </div>
                    )}

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
                      />
                      {errors.username && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.username}
                        </p>
                      )}
                    </div>

                    {/* Password field (only shown for email signup) */}
                    {signupMethod === "email" && (
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          value={signupForm.password}
                          onChange={handleSignupChange}
                        />
                        {errors.password && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.password}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Birthdate field */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-birthdate">Birthdate</Label>
                      <Input
                        id="signup-birthdate"
                        name="birthdate"
                        type="date"
                        value={signupForm.birthdate ? format(signupForm.birthdate, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          handleDateChange(date);
                        }}
                        max={format(new Date(), "yyyy-MM-dd")}
                        className="w-full"
                      />
                      {errors.birthdate && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.birthdate}
                        </p>
                      )}
                    </div>

                    {/* Pronoun field */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-pronoun">Pronoun</Label>
                      <Select value={signupForm.pronoun} onValueChange={handleSelectChange}>
                        <SelectTrigger id="signup-pronoun">
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

                    {/* Terms and conditions checkbox */}
                    <div className="space-y-2 mt-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="terms"
                          checked={signupForm.termsAccepted}
                          onCheckedChange={(checked) => handleCheckboxChange("termsAccepted", checked === true)}
                        />
                        <div>
                          <Label htmlFor="terms" className="text-sm">
                            I agree to the{" "}
                            <Button variant="link" className="p-0 h-auto text-xs">
                              terms and conditions
                            </Button>
                          </Label>
                          {errors.termsAccepted && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.termsAccepted}
                            </p>
                          )}
                        </div>
                      </div>
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

                    <Button className="w-full mt-4" type="submit">
                      Create Account
                    </Button>
                  </form>

                  <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("login")}>
                      Login
                    </Button>
                  </div>
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

