"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import ProfileCompletionModal from "@/components/profile-completion-modal"

export function ProfileCheck() {
  const { data: session, status } = useSession()
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  useEffect(() => {
    // Only check after we're sure auth is loaded (not during "loading" state)
    if (status === "authenticated") {
      console.log("Auth Status:", status);
      console.log("Full Session Data:", session);
      console.log("User Data:", session?.user);
      console.log("Username:", session?.user?.username);
      console.log("isProfileComplete:", session?.user?.isProfileComplete);
      
      // Check if user is logged in but profile is incomplete
      const needsProfileCompletion = session?.user && (
        !session.user.username || 
        session.user.isProfileComplete === false
      );
      
      console.log("Needs Profile Completion:", needsProfileCompletion);
      
      if (needsProfileCompletion) {
        console.log("Opening profile completion modal");
        setShowProfileModal(true);
      } else {
        console.log("Profile is complete or user not authenticated");
        setShowProfileModal(false);
      }
    } else {
      console.log("Auth Status (not authenticated):", status);
    }
  }, [session, status])
  
  // Force modal to stay open until profile is completed
  const handleClose = () => {
    // Only allow closing if profile is complete
    if (session?.user?.username && session.user.isProfileComplete !== false) {
      console.log("Allowing modal close - profile is complete");
      setShowProfileModal(false);
    } else if (session?.user) {
      // If user is logged in but trying to close an incomplete profile
      console.log("Preventing modal close - profile incomplete");
      console.log("Current user state:", {
        username: session.user.username,
        isProfileComplete: session.user.isProfileComplete
      });
    }
  }
  
  // Don't render anything during loading or if user isn't authenticated
  if (status !== "authenticated" || !session?.user) {
    return null;
  }
  
  return (
    <ProfileCompletionModal
      isOpen={showProfileModal}
      onClose={handleClose}
    />
  )
} 