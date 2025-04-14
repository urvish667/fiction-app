"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { signOut, useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Navbar from "@/components/navbar"
import { UserPreferences, defaultPreferences } from "@/types/user"
import { useRouter, useSearchParams } from 'next/navigation';

// UI Imports (ensure all needed are here)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Check } from "lucide-react"

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

// --- Donation Settings Types (Copied from donations/page.tsx) ---
interface DonationSettingsData {
  donationsEnabled: boolean;
  donationMethod: 'paypal' | 'stripe' | null;
  donationLink: string | null;
}
// --- End Donation Settings Types ---

export default function SettingsPage() {
  const { toast } = useToast()
  const { data: session, update, status: sessionStatus } = useSession()
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize activeTab correctly
  const initialTab = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('tab') || 'profile') : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [savingPreferences, setSavingPreferences] = useState<string | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // --- Donation Settings State (Copied & Renamed) ---
  const [donationSettings, setDonationSettings] = useState<DonationSettingsData | null>(null);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);
  const [isSavingDonations, setIsSavingDonations] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);
  const [enableDonations, setEnableDonations] = useState(false);
  const [donationMethod, setDonationMethod] = useState<'paypal' | 'stripe' | null>(null);
  const [paypalLink, setPaypalLink] = useState('');
  // --- End Donation Settings State ---

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: "",
      username: "",
      bio: "",
      location: "",
      website: "",
      socialLinks: {
        twitter: "",
        instagram: "",
        facebook: "",
      },
    },
  })

  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/user/profile")
          if (!response.ok) {
            throw new Error('Failed to fetch profile data')
          }
          const userData = await response.json()
          console.log("Fetched User Data for Reset:", userData); // Keep console log for checking

          // Reset main fields
          form.reset({
            name: userData.name || "",
            username: userData.username || "",
            bio: userData.bio || "",
            location: userData.location || "",
            website: userData.website || "",
          })

          // Explicitly set social link values - access the nested 'set' property
          const links = userData.socialLinks?.set || {}; // Use optional chaining and access .set
          form.setValue('socialLinks.twitter', links.twitter || "");
          form.setValue('socialLinks.instagram', links.instagram || "");
          form.setValue('socialLinks.facebook', links.facebook || "");

          // Update session preferences if needed
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
  }, [session?.user?.id, form, toast, update, session])

  // --- Donation Settings Effects (Copied & Adapted) ---
  // Fetch initial donation settings
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const fetchDonationSettings = async () => {
        setIsLoadingDonations(true);
        setDonationError(null);
        try {
          const response = await fetch('/api/user/donation-settings');
          if (!response.ok) {
            throw new Error('Failed to fetch donation settings.');
          }
          const data: DonationSettingsData = await response.json();
          setDonationSettings(data);
          // Initialize donation form state
          setEnableDonations(data.donationsEnabled);
          setDonationMethod(data.donationMethod);
          setPaypalLink(data.donationMethod === 'paypal' && data.donationLink ? data.donationLink : '');

        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
          setDonationError(errorMsg);
          toast({
            title: 'Error Loading Donation Settings',
            description: errorMsg,
            variant: 'destructive',
          });
        } finally {
          setIsLoadingDonations(false);
        }
      };
      fetchDonationSettings();
    }
    // No redirect needed here as main settings page handles auth
  }, [sessionStatus, toast]); // Depend on sessionStatus

  // Handle messages from Stripe callback (for donations)
  useEffect(() => {
    if (!searchParams) return; 

    const stripeSuccess = searchParams.get('success');
    const stripeError = searchParams.get('error');
    const currentTab = searchParams.get('tab'); // Check if we landed on the right tab

    if (stripeSuccess === 'stripe_connected' && currentTab === 'monetization') {
      toast({
        title: 'Success!',
        description: 'Your Stripe account has been connected successfully.',
      });
      // Update state and clear query params
      setEnableDonations(true);
      setDonationMethod('stripe');
      // TODO: Optionally re-fetch donation settings to get the Stripe ID for display
      router.replace('/settings?tab=monetization', { scroll: false }); 
    }

    if (stripeError && currentTab === 'monetization') {
      toast({
        title: 'Stripe Connection Failed',
        description: `Could not connect Stripe account: ${stripeError}. Please try again.` ,
        variant: 'destructive',
      });
      router.replace('/settings?tab=monetization', { scroll: false }); 
    }
  }, [searchParams, router, toast]);
  // --- End Donation Settings Effects ---

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const saveProfileInfo = async (data: Partial<SettingsFormValues>) => {
    setIsUpdating(true)
    try {
      const profileData: Record<string, any> = {}
      if (data.username) profileData.username = data.username;
      if (data.name !== undefined) profileData.name = data.name
      if (data.bio !== undefined) profileData.bio = data.bio
      if (data.location !== undefined) profileData.location = data.location
      if (data.website !== undefined) profileData.website = data.website

      if (Object.keys(profileData).length === 0 || (Object.keys(profileData).length === 1 && profileData.username === session?.user?.username)) {
         console.log("No profile info changes detected.")
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

      await update()
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

      await update()

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

      await update()

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

  const saveSocialLinks = async (data: Pick<SettingsFormValues, 'username' | 'socialLinks'>) => {
    setIsUpdating(true)
    try {
      const linksData = {
        username: data.username || session?.user?.username,
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
          Object.entries(result.fields).forEach(([key, value]) => {
             if (key.startsWith('socialLinks.')) {
                const fieldName = key.split('.')[1] as keyof SettingsFormValues['socialLinks'];
                if (fieldName) {
                    form.setError(`socialLinks.${fieldName}` as any, {
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

      await update()
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

  const changePassword = async () => {
    console.log('changePassword function called in SettingsPage');
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
      setIsDeleteDialogOpen(false)
    } finally {
      setIsDeletingAccount(false)
    }
  }

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

      if (session) {
        await update({
          ...session,
          user: {
            ...session.user,
            preferences: preferences
          }
        });
      }

      await update({ force: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      console.log("Preferences saved and session updated.");
      return true

    } catch (error) {
      console.error('Error saving preferences:', error)
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

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
    } finally {
      setSavingPreferences(null);
    }
  }

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
    } finally {
      setSavingPreferences(null);
    }
  }

  // --- Donation Settings Handlers (Copied & Renamed) ---
  const handleEnableDonationToggle = (checked: boolean) => {
    setEnableDonations(checked);
    if (!checked) {
      setDonationMethod(null);
      setPaypalLink('');
    } else {
      if (!donationMethod) setDonationMethod('paypal'); // Default to paypal if enabling
    }
  };

  const handleDonationMethodChange = (value: string) => {
    setDonationMethod(value as 'paypal' | 'stripe');
  };

  const handleConnectStripe = () => {
    setIsSavingDonations(true); 
    const clientId = process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/stripe/oauth/callback`;
    const state = 'random_state_value_TODO'; // Replace with actual state generation

    if (!clientId) {
        setDonationError('Stripe Client ID is not configured.');
        toast({ title: 'Configuration Error', description: 'Stripe is not configured.', variant: 'destructive' });
        setIsSavingDonations(false);
        return;
    }
    const stripeConnectUrl = `https://connect.stripe.com/express/oauth/authorize?client_id=${clientId}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&stripe_user[email]=${session?.user?.email || ''}`;
    window.location.href = stripeConnectUrl;
  };

  const handleSaveDonationChanges = async () => {
    setIsSavingDonations(true);
    setDonationError(null);
    try {
      let response: Response | undefined;
      if (!enableDonations) {
        response = await fetch('/api/user/disable-donations', { method: 'POST' });
      } else {
        if (donationMethod === 'paypal') {
          response = await fetch('/api/user/enable-donations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'paypal', link: paypalLink }),
          });
        } else if (donationMethod === 'stripe') {
          console.log('Stripe selected. Connection is managed via the OAuth flow.');
          toast({ title: 'Settings Updated', description: 'Stripe selected. Connection status reflects the last update from Stripe.' });
          // Optimistically update UI state - fetch might refresh this later?
          setDonationSettings({
            donationsEnabled: true,
            donationMethod: 'stripe',
            donationLink: donationSettings?.donationLink ?? null
          });
          setIsSavingDonations(false);
          return; // Exit early
        } else {
          throw new Error('Please select a valid donation method.');
        }
      }

      if (!response) {
        throw new Error('An unexpected error occurred during saving.');
      }

      if (!response.ok) {
        let message = 'Failed to update donation settings.';
        try {
          const errorData = await response.json();
          message = errorData?.errors?.[0]?.message || errorData?.message || message;
        } catch (e) { /* Ignore */ }
        throw new Error(message);
      }

      const result = await response.json();
      toast({ title: 'Success', description: result.message || 'Settings updated.' });

      // Update local state to match saved state
      let finalDonationLink: string | null = null;
      if (enableDonations) {
        if (donationMethod === 'paypal') {
          finalDonationLink = paypalLink;
        } else if (donationMethod === 'stripe') {
          // Keep existing Stripe link if available, otherwise null
          finalDonationLink = donationSettings?.donationLink ?? null;
        }
        // If method is null (shouldn't happen if enabled), link remains null
      }
      // If !enableDonations, link remains null

      setDonationSettings({
        donationsEnabled: enableDonations,
        donationMethod: enableDonations ? donationMethod : null,
        donationLink: finalDonationLink 
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setDonationError(errorMessage);
      toast({ title: 'Error Saving Settings', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSavingDonations(false);
    }
  };
  // --- End Donation Settings Handlers ---

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto p-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="monetization">Monetization</TabsTrigger>
          </TabsList>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TabsContent value="profile">
              <ProfileSettings
                session={session as any}
                form={form as any}
                isUpdating={isUpdating}
                saveProfileInfo={saveProfileInfo}
                saveSocialLinks={saveSocialLinks}
                updateProfileImage={updateProfileImage}
                updateBannerImage={updateBannerImage}
              />
            </TabsContent>
            <TabsContent value="account">
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
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationSettings
                session={session}
                handleNotificationToggle={handleNotificationToggle}
                savingPreferences={savingPreferences}
                update={update}
                toast={toast}
              />
            </TabsContent>
            <TabsContent value="privacy">
              <PrivacySettings
                session={session}
                handlePrivacyToggle={handlePrivacyToggle}
                savingPreferences={savingPreferences}
              />
            </TabsContent>
            <TabsContent value="monetization">
              <Card>
                <CardHeader>
                  <CardTitle>Monetization / Donations</CardTitle>
                  <CardDescription>Manage how others can support your work.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingDonations ? (
                    <div className="flex items-center justify-center p-8"><p>Loading donation settings...</p></div>
                  ) : (
                    <div className="space-y-6">
                      {donationError && <p className="text-red-500 mb-4">Error: {donationError}</p>}

                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="enable-donations" className="text-base font-medium">
                            Enable Donations
                          </Label>
                          <p className="text-sm text-muted-foreground">Allow readers to support you directly.</p>
                        </div>
                        <Switch
                          id="enable-donations"
                          checked={enableDonations}
                          onCheckedChange={handleEnableDonationToggle} 
                          aria-label="Enable or disable donations"
                        />
                      </div>

                      {enableDonations && (
                        <div className="space-y-4 pt-6 border-t">
                          <Label className="block text-base font-medium mb-3">Donation Method</Label>
                          <RadioGroup
                            value={donationMethod || ''}
                            onValueChange={handleDonationMethodChange}
                            className="space-y-3"
                          >
                            <Label htmlFor="paypal" className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                              <RadioGroupItem value="paypal" id="paypal" />
                              <span className="font-medium">PayPal</span>
                            </Label>
                            <Label htmlFor="stripe" className={`flex items-center space-x-3 p-4 border rounded-md transition-colors ${!process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-muted/50'}`}>
                              <RadioGroupItem value="stripe" id="stripe" disabled={!process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID} />
                              <span className="font-medium">Stripe Connect</span>
                              {!process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID && <span className="text-xs ml-auto text-muted-foreground">(Admin setup required)</span>}
                            </Label>
                          </RadioGroup>

                          {donationMethod === 'paypal' && (
                            <div className="space-y-2 pt-4 pl-2">
                              <Label htmlFor="paypal-link" className="text-sm font-medium">PayPal.me Link or Email</Label>
                              <Input
                                id="paypal-link"
                                type="text"
                                value={paypalLink}
                                onChange={(e) => setPaypalLink(e.target.value)}
                                placeholder="e.g., paypal.me/yourname or your@email.com"
                                disabled={isSavingDonations}
                                className="max-w-md"
                              />
                              {donationSettings?.donationMethod === 'paypal' && (
                                  <p className="text-xs text-muted-foreground pt-1">(Current: {donationSettings.donationLink ?? 'N/A'})</p>
                              )}
                            </div>
                          )}

                          {donationMethod === 'stripe' && (
                            <div className="space-y-2 pt-4 pl-2">
                              {donationSettings?.donationMethod === 'stripe' && donationSettings?.donationLink ? (
                                <div className="flex items-center gap-2">
                                  <Check className="h-5 w-5 text-green-600" />
                                  <p className="text-sm text-green-600">Stripe account connected</p>
                                  <p className="text-xs text-muted-foreground">(ID: {donationSettings.donationLink ?? 'N/A'})</p>
                                </div>
                              ) : (
                                <div>
                                  <Button onClick={handleConnectStripe} disabled={isSavingDonations || !process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID} >
                                      {isSavingDonations ? 'Redirecting...' : 'Connect Stripe Account'}
                                  </Button>
                                  {!process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID && <p className="text-xs text-muted-foreground mt-1">Stripe integration is not configured.</p>}
                               </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                {!isLoadingDonations && (
                  <CardFooter className="border-t px-6 py-4">
                    <Button 
                      onClick={handleSaveDonationChanges}
                      disabled={isSavingDonations || isLoadingDonations}
                      className="ml-auto"
                    >
                      {isSavingDonations ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </div>
  )
}

