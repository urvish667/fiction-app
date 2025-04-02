"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { debounce } from "lodash"

interface ProfileCompletionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileCompletionModal({ isOpen, onClose }: ProfileCompletionModalProps) {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    username: "",
    birthdate: null as Date | null,
    pronoun: "",
    termsAccepted: false,
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

  // Check username availability with debounce
  const checkUsernameAvailability = debounce(async (username: string) => {
    if (!username || username.length < 3) {
      return;
    }

    setUsernameAvailability((prev) => ({ ...prev, isChecking: true }));
    console.log(`Checking username availability: ${username}`);

    try {
      const response = await fetch(`/api/auth/username-check?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      console.log("Username check response:", data);

      setUsernameAvailability({
        available: data.available,
        error: data.error,
        isChecking: false,
      });

      if (!data.available && data.error) {
        setErrors((prev) => ({ ...prev, username: data.error }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.username;
          return newErrors;
        });
      }
    } catch (error) {
      console.error("Error checking username availability:", error);
      setUsernameAvailability({
        available: false,
        error: "Error checking username availability",
        isChecking: false,
      });
    }
  }, 500);

  // Clear username availability check when component unmounts
  useEffect(() => {
    return () => {
      checkUsernameAvailability.cancel();
    };
  }, [checkUsernameAvailability]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
    
    // Check username availability
    if (name === "username") {
      checkUsernameAvailability(value);
    }
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, pronoun: value }))
    if (errors.pronoun) {
      setErrors((prev) => ({ ...prev, pronoun: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    
    if (!formData.username) {
      newErrors.username = "Username is required"
    } else if (formData.username.length < 3) {
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
    
    if (Object.keys(newErrors).length > 0) {
      console.log("Form validation errors:", newErrors);
      return
    }
    
    setIsSubmitting(true)
    console.log("Submitting profile data:", formData);
    
    try {
      // Call API to complete profile
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          birthdate: formData.birthdate ? formData.birthdate.toISOString().split("T")[0] : "",
          pronoun: formData.pronoun,
          termsAccepted: formData.termsAccepted,
        }),
      })
      
      const data = await response.json()
      console.log("Profile completion response:", data);
      
      if (!response.ok) {
        if (data.fields) {
          console.log("Field-specific errors:", data.fields);
          setErrors(data.fields)
        } else {
          console.log("General error:", data.error);
          setErrors({ form: data.error || "An error occurred" })
        }
      } else {
        console.log("Profile completed successfully");
        // Update the session to reflect completed profile
        await update()
        onClose()
        router.refresh()
      }
    } catch (error) {
      console.error("Profile completion error:", error)
      setErrors({ form: "An error occurred while completing your profile" })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Complete Your Profile</DialogTitle>
        </DialogHeader>
        
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
            {/* Username availability indicator */}
            {formData.username && formData.username.length >= 3 && !errors.username && (
              <p className={`text-xs flex items-center gap-1 ${
                usernameAvailability.isChecking 
                  ? "text-muted-foreground"
                  : usernameAvailability.available 
                    ? "text-green-500" 
                    : "text-destructive"
              }`}>
                {usernameAvailability.isChecking 
                  ? "Checking availability..." 
                  : usernameAvailability.available 
                    ? "Username is available" 
                    : usernameAvailability.error}
              </p>
            )}
          </div>

          {/* Birthdate field */}
          <div className="space-y-2">
            <Label htmlFor="birthdate">Birthdate</Label>
            <Input
              id="birthdate"
              name="birthdate"
              type="date"
              value={formData.birthdate ? format(formData.birthdate, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setFormData(prev => ({ ...prev, birthdate: date }));
                if (errors.birthdate) {
                  setErrors(prev => ({ ...prev, birthdate: "" }));
                }
              }}
              max={format(new Date(), "yyyy-MM-dd")}
              className="w-full"
              disabled={isSubmitting}
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
            <Label htmlFor="pronoun">Pronoun</Label>
            <Select 
              value={formData.pronoun} 
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
                checked={formData.termsAccepted}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, termsAccepted: checked === true }))}
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

          {/* General error */}
          {errors.form && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.form}
            </p>
          )}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 