"use client"

import { useState } from "react"
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

export interface MatureContentDialogProps {
  storySlug: string
  onConsent: () => void
  isOpen?: boolean
  onClose?: () => void
  storyTitle?: string
}

export function MatureContentDialog({
  storySlug,
  onConsent,
  isOpen,
  onClose,
  storyTitle,
}: MatureContentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(true)
  const router = useRouter()

  const isControlled = isOpen !== undefined
  const open = isControlled ? isOpen : internalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose?.()
    }
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
  }

  // Handle consent
  const handleConsent = () => {
    localStorage.setItem(`mature-content-consent-${storySlug}`, "true")
    if (!isControlled) setInternalOpen(false)
    onClose?.()
    onConsent()
  }

  // Handle cancel
  const handleCancel = () => {
    if (!isControlled) setInternalOpen(false)
    onClose?.()
    router.push("/browse")
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
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

export default MatureContentDialog
