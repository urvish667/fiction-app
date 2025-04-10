"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { signOut, useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Navbar from "@/components/navbar"
import { UserPreferences, defaultPreferences } from "@/types/user"
// Router no longer needed with window.location.reload()

// Import the new settings components
import ProfileSettings from "@/components/settings/ProfileSettings"
import AccountSettings from "@/components/settings/AccountSettings"
import NotificationSettings from "@/components/settings/NotificationSettings"
import PrivacySettings from "@/components/settings/PrivacySettings"

// Combined form validation schema (remains here)
const settingsFormSchema = z.object({
  name: z.string().max(50, "Name is too long").optional(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  location: z.string().max(100, "Location must be less than 100 characters").optional().nullable(),
  website: z.string().url("Please enter a valid URL").optional().nullable(),
  socialLinks: z.object({
    twitter: z.string().url("Please enter a valid URL").optional().nullable(),
    instagram: z.string().url("Please enter a valid URL").optional().nullable(),
    facebook: z.string().url("Please enter a valid URL").optional().nullable(),
  }).optional().nullable(),
  // Keep language and theme here if they might be used elsewhere in SettingsPage or are global settings
  // language: z.enum(["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"]).optional().default("en"),
  // theme: z.enum(["light", "dark", "system"]).optional().default("system"),
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

export default function SettingsPage() {
  const { toast } = useToast()
  const { data: session, update } = useSession()
  // Router no longer needed with window.location.reload()
  const [activeTab, setActiveTab] = useState("profile")
  const [isUpdating, setIsUpdating] = useState(false) // Shared state for profile/social save buttons
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [savingPreferences, setSavingPreferences] = useState<string | null>(null) // For notification/privacy toggles

  // Password form state (remains here for AccountSettings)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Initialize the main form (remains here)
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: "", // Initialized empty, loaded via useEffect
      username: "", // Initialized empty, loaded via useEffect
      bio: "",
      location: "",
      website: "",
      socialLinks: {
        twitter: "",
        instagram: "",
        facebook: "",
      },
      // language: "en",
      // theme: "system",
    },
  })

  // Load user data (remains here)
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/user/profile")
          if (!response.ok) {
            throw new Error('Failed to fetch profile data')
          }
          const userData = await response.json()

          // Reset form with fetched data
          form.reset({
            name: userData.name || "",
            username: userData.username || "",
            bio: userData.bio || "",
            location: userData.location || "",
            website: userData.website || "",
            socialLinks: userData.socialLinks || {
              twitter: "",
              instagram: "",
              facebook: "",
            },
            // language: userData.language || "en",
            // theme: userData.theme || "system",
          })

          // Update session preferences if not already loaded correctly (optional but good practice)
          if (!session.user.preferences && userData.preferences) {
            await update({
              ...session,
              user: {
                ...session.user,
                preferences: userData.preferences,
              }
            })
          }

        } catch (error) {
          console.error("Error loading user data:", error)
          toast({
            title: "Error",
            description: "Failed to load profile data",
            variant: "destructive",
          })
        }
      }
    }

    loadUserData()
  }, [session?.user?.id, form, toast, update, session]) // Added update and session to dependency array

  // Handle password form change (remains here)
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  // Save profile information (remains here, passed to ProfileSettings)
  const saveProfileInfo = async (data: Partial<SettingsFormValues>) => {
    setIsUpdating(true)
    try {
      // Prepare data, ensuring username is always included if present in form data
      const profileData: Record<string, any> = {}
      if (data.username) profileData.username = data.username;
      if (data.name !== undefined) profileData.name = data.name
      if (data.bio !== undefined) profileData.bio = data.bio
      if (data.location !== undefined) profileData.location = data.location
      if (data.website !== undefined) profileData.website = data.website
      // if (data.language !== undefined) profileData.language = data.language
      // if (data.theme !== undefined) profileData.theme = data.theme

      // If no specific fields to update other than username (which might not change), return early?
      // Or ensure the API handles this gracefully.
      if (Object.keys(profileData).length === 0 || (Object.keys(profileData).length === 1 && profileData.username === session?.user?.username)) {
         console.log("No profile info changes detected.")
         // Optionally show a toast message?
         // toast({ title: "No changes", description: "No profile information was changed." });
         setIsUpdating(false);
         return;
      }

      console.log('Saving profile data:', profileData)

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.fields) {
          Object.entries(result.fields).forEach(([key, value]) => {
            form.setError(key as keyof SettingsFormValues, {
              type: "manual",
              message: value as string,
            })
          })
        }
        throw new Error(result.error || "Failed to update profile information")
      }

      await update() // Update session
      toast({
        title: "Success",
        description: "Your profile information has been updated",
      })

    } catch (error) {
      console.error("Error updating profile information:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile information",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Update profile image
  const updateProfileImage = async (imageUrl: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageUrl,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile image")
      }

      // Update the session with new image
      await update()

      // Force a hard refresh to update all components
      window.location.reload()
    } catch (error) {
      console.error("Error updating profile image:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile image",
        variant: "destructive",
      })
      throw error
    }
  }

  // Update banner image
  const updateBannerImage = async (imageUrl: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bannerImage: imageUrl,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update banner image")
      }

      // Update the session with new banner image
      await update()

      // Force a hard refresh to update all components
      window.location.reload()
    } catch (error) {
      console.error("Error updating banner image:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update banner image",
        variant: "destructive",
      })
      throw error
    }
  }

  // Save social links (remains here, passed to ProfileSettings)
  const saveSocialLinks = async (data: Pick<SettingsFormValues, 'username' | 'socialLinks'>) => {
    setIsUpdating(true)
    try {
      // Ensure username is included for the API endpoint
      const linksData = {
        username: data.username || session?.user?.username, // Fallback to session username
        socialLinks: data.socialLinks || {},
      }

       if (!linksData.username) {
        throw new Error("Username is required to update social links.")
      }

      console.log('Saving social links:', linksData)

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linksData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.fields) {
          // Adjust error setting for nested structure
          Object.entries(result.fields).forEach(([key, value]) => {
             if (key.startsWith('socialLinks.')) {
                const fieldName = key.split('.')[1] as keyof SettingsFormValues['socialLinks'];
                if (fieldName) {
                    form.setError(`socialLinks.${fieldName}` as any, { // Use template literal and 'any' if needed
                        type: "manual",
                        message: value as string,
                    });
                }
            } else {
                 form.setError(key as keyof SettingsFormValues, {
                    type: "manual",
                    message: value as string,
                 });
            }
          })
        }
        throw new Error(result.error || "Failed to update social links")
      }

      await update() // Update session
      toast({
        title: "Success",
        description: "Your social links have been updated",
      })

    } catch (error) {
      console.error("Error updating social links:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update social links",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Change password (remains here, passed to AccountSettings)
  const changePassword = async () => {
    console.log('changePassword function called in SettingsPage');
    // Basic client-side validation (can be enhanced)
    if (passwordForm.newPassword.length < 8) {
      toast({ title: "Password too short", description: "New password must be at least 8 characters long.", variant: "destructive" })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirm password must match.", variant: "destructive" })
      return
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
        toast({ title: "Same password", description: "New password must be different from your current password.", variant: "destructive" })
        return
    }

    setIsChangingPassword(true)
    try {
      console.log('Sending password change request...');
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      })
      console.log('Password change response status:', response.status);
      const result = await response.json()
      console.log('Password change response:', result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password")
      }

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast({
        title: "Password Changed Successfully",
        description: "Your password has been updated.",
        variant: "default",
        duration: 5000,
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Delete account (remains here, passed to AccountSettings)
  const deleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      const requestData: { confirmation: boolean; password?: string } = { confirmation: true }
      if ((session?.user as any)?.provider === "credentials") {
        requestData.password = deletePassword
      }

      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account")
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
        variant: "default",
      })
      await signOut({ callbackUrl: "/" })

    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      })
      setIsDeleteDialogOpen(false) // Close dialog on error
    } finally {
      setIsDeletingAccount(false)
    }
  }

  // Save preferences (centralized function)
  const savePreferences = async (preferences: UserPreferences) => {
     console.log("Saving preferences:", preferences);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
         const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to save preferences')
      }

      // First, directly update the session with the new preferences
      if (session) {
        await update({
          ...session,
          user: {
            ...session.user,
            preferences: preferences
          }
        });
      }

      // Then force a complete refresh to ensure everything is in sync
      await update({ force: true });

      // Wait a moment to ensure the session is fully updated
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log("Preferences saved and session updated.");
      return true // Indicate success

    } catch (error) {
      console.error('Error saving preferences:', error)
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      })
      throw error // Rethrow to be caught by toggle handlers
    }
  }

  // Notification toggle handler (remains here, passed to NotificationSettings)
  const handleNotificationToggle = async (key: keyof UserPreferences['emailNotifications']) => {
    if (!session?.user?.preferences) return;
    setSavingPreferences(`notification-${key}`);
    try {
      const currentPrefs = session.user.preferences;
      const newPreferences: UserPreferences = {
        ...currentPrefs,
        emailNotifications: {
          ...defaultPreferences.emailNotifications,
          ...currentPrefs.emailNotifications,
          [key]: !(currentPrefs.emailNotifications?.[key] ?? defaultPreferences.emailNotifications[key]),
        },
      };
      await savePreferences(newPreferences);
      toast({ title: "Preference Updated", description: `Email notification for ${key} updated.` });
    } catch (error) {
       console.error(`Error updating notification preference ${key}:`, error);
       // Toast is handled in savePreferences
    } finally {
      setSavingPreferences(null);
    }
  }

  // Privacy toggle handler (remains here, passed to PrivacySettings)
  const handlePrivacyToggle = async (key: keyof UserPreferences['privacySettings']) => {
    if (!session?.user?.preferences) return;
    setSavingPreferences(`privacy-${key}`);
    try {
      const currentPrefs = session.user.preferences;
      const newPreferences: UserPreferences = {
         ...currentPrefs,
        privacySettings: {
          ...defaultPreferences.privacySettings,
          ...currentPrefs.privacySettings,
          [key]: !(currentPrefs.privacySettings?.[key] ?? defaultPreferences.privacySettings[key]),
        },
      };
      await savePreferences(newPreferences);
      toast({ title: "Preference Updated", description: `Privacy setting for ${key} updated.` });
    } catch (error) {
       console.error(`Error updating privacy preference ${key}:`, error);
       // Toast is handled in savePreferences
    } finally {
      setSavingPreferences(null);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* Profile Tab Content */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ProfileSettings
                session={session}
                form={form}
                isUpdating={isUpdating}
                saveProfileInfo={saveProfileInfo}
                saveSocialLinks={saveSocialLinks}
                updateProfileImage={updateProfileImage}
                updateBannerImage={updateBannerImage}
              />
            </motion.div>
          </TabsContent>

          {/* Account Tab Content */}
          <TabsContent value="account">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
               <AccountSettings
                  session={session}
                  passwordForm={passwordForm}
                  handlePasswordChange={handlePasswordChange}
                  changePassword={changePassword}
                  isChangingPassword={isChangingPassword}
                  isDeleteDialogOpen={isDeleteDialogOpen}
                  setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                  deletePassword={deletePassword}
                  setDeletePassword={setDeletePassword}
                  deleteAccount={deleteAccount}
                  isDeletingAccount={isDeletingAccount}
               />
            </motion.div>
          </TabsContent>

          {/* Notifications Tab Content */}
          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
               <NotificationSettings
                  session={session}
                  handleNotificationToggle={handleNotificationToggle}
                  savingPreferences={savingPreferences}
                  update={update} // Pass update function
                  toast={toast} // Pass toast function
               />
            </motion.div>
          </TabsContent>

          {/* Privacy Tab Content */}
          <TabsContent value="privacy">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <PrivacySettings
                   session={session}
                   handlePrivacyToggle={handlePrivacyToggle}
                   savingPreferences={savingPreferences}
                />
            </motion.div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  )
}

