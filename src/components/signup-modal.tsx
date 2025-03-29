"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSignup: () => void
}

export default function SignupModal({ isOpen, onClose, onSignup }: SignupModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    birthdate: "",
    termsAccepted: false
  })
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState("")
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false)

  const checkUsernameAvailability = async (username: string) => {
    if (!username) {
      setUsernameError("Username is required")
      setIsUsernameAvailable(false)
      return
    }

    setIsCheckingUsername(true)
    try {
      // Here you would typically make an API call to check username availability
      // For now, we'll simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Simulate username check - replace this with actual API call
      const isAvailable = username.length >= 3 && !username.includes(" ")
      setIsUsernameAvailable(isAvailable)
      setUsernameError(isAvailable ? "" : "Username is already taken or invalid")
    } catch (error) {
      setUsernameError("Error checking username availability")
      setIsUsernameAvailable(false)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const username = e.target.value
    setFormData({ ...formData, username })
    checkUsernameAvailability(username)
  }

  const handleSubmit = () => {
    if (!formData.username || !formData.birthdate || !formData.termsAccepted) {
      return
    }
    onSignup()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-center">Add your personal details to get started</DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input 
                id="username" 
                type="text" 
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleUsernameChange}
                className={usernameError ? "border-red-500" : isUsernameAvailable ? "border-green-500" : ""}
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                </div>
              )}
            </div>
            {usernameError && (
              <Alert variant="destructive" className="text-xs">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{usernameError}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdate">Birth Date</Label>
            <Input 
              id="birthdate" 
              type="date"
              value={formData.birthdate}
              onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => setFormData({ ...formData, termsAccepted: checked as boolean })}
            />
            <Label htmlFor="terms" className="text-sm">
              I agree to the{" "}
              <Button variant="link" className="p-0 h-auto text-xs">
                terms and conditions
              </Button>
            </Label>
          </div>
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={!isUsernameAvailable || !formData.birthdate || !formData.termsAccepted}
          >
            Complete Sign Up
          </Button>
        </motion.div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline">Google</Button>
          <Button variant="outline">Facebook</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 