"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MatureContentDialogProps {
  storySlug: string
  onConsent: () => void
}

export default function MatureContentDialog({ storySlug, onConsent }: MatureContentDialogProps) {
  const [open, setOpen] = useState(true)
  const router = useRouter()

  // Handle consent
  const handleConsent = () => {
    // Store consent in localStorage
    localStorage.setItem(`mature-content-consent-${storySlug}`, "true")
    // Close dialog
    setOpen(false)
    // Call the onConsent callback
    onConsent()
  }

  // Handle cancel
  const handleCancel = () => {
    // Close dialog
    setOpen(false)
    // Redirect to browse page
    router.push("/browse")
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mature Content Warning</AlertDialogTitle>
          <AlertDialogDescription>
            This story contains mature content that may not be suitable for all audiences. 
            It may include adult themes, violence, or explicit content.
            <br /><br />
            By continuing, you confirm that you are of appropriate age to view such content.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Go Back</AlertDialogCancel>
          <AlertDialogAction onClick={handleConsent}>I Understand, Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Helper function to check if consent is needed
export function needsMatureContentConsent(storySlug: string, isMature: boolean, isLoggedIn: boolean): boolean {
  // If the story is not mature, no consent needed
  if (!isMature) return false
  
  // If user is logged in, no consent needed
  if (isLoggedIn) return false
  
  // Check if consent was previously given for this story
  const hasConsent = typeof window !== 'undefined' && localStorage.getItem(`mature-content-consent-${storySlug}`) === "true"
  
  // Need consent if the story is mature, user is not logged in, and hasn't given consent before
  return !hasConsent
}
