"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { signOut, useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Navbar from "@/components/navbar"
import { UserPreferences, defaultPreferences } from "@/types/user"
import { ExtendedUser, ExtendedSession } from "@/components/settings/ProfileSettings"
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from "@/lib/client/csrf";
import { logError } from "@/lib/error-logger"

// Import the new settings components
import ProfileSettings from "@/components/settings/ProfileSettings"
import AccountSettings from "@/components/settings/AccountSettings"
import NotificationSettings from "@/components/settings/NotificationSettings"
import PrivacySettings from "@/components/settings/PrivacySettings"
import MonetizationSettings from "@/components/settings/MonetizationSettings"

// Combined form validation schema (remains here)
const settingsFormSchema = z.object({
  name: z.string().max(50, "Name is too long").optional(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  location: z.string().max(100, "Location must be less than 100 characters").optional().nullable(),
  website: z.union([z.literal(''), z.string().url("Please enter a valid URL")]).optional().nullable(),
  socialLinks: z.object({
    twitter: z.union([z.literal(''), z.string().url("Please enter a valid URL")]).optional().nullable(),
    instagram: z.union([z.literal(''), z.string().url("Please enter a valid URL")]).optional().nullable(),
    facebook: z.union([z.literal(''), z.string().url("Please enter a valid URL")]).optional().nullable(),
  }).optional().nullable(),
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

// --- Donation Settings Types (Copied from donations/page.tsx) ---
interface DonationSettingsData {
  id?: string;
  donationsEnabled: boolean;
  donationMethod: 'PAYPAL' | 'STRIPE' | 'BMC' | 'KOFI' | null;
  donationLink: string | null;
}
// --- End Donation Settings Types ---

import { useSearchParams } from 'next/navigation';

// Component to handle URL parameters with Suspense boundary
function TabParamsHandler({
  toast,
  router,
  setActiveTab,
  setEnableDonations,
  setDonationMethod,
  donationSettings
}: {
  toast: any;
  router: any;
  setActiveTab: (tab: string) => void;
  setEnableDonations: (enabled: boolean) => void;
  setDonationMethod: (method: 'PAYPAL' | 'STRIPE' | 'BMC' | 'KOFI' | null) => void;
  donationSettings: DonationSettingsData | null;
}) {
  const searchParams = useSearchParams();

  // Handle URL parameters
  useEffect(() => {
    if (!searchParams) return;

    const stripeSuccess = searchParams.get('success');
    const stripeError = searchParams.get('error');
    const currentTab = searchParams.get('tab');

    if (stripeSuccess === 'stripe_connected' && currentTab === 'monetization') {
      toast({
        title: 'Success!',
        description: 'Your Stripe account has been connected successfully.',
      });
      // Update state and clear query params
      setEnableDonations(true);
      setDonationMethod('STRIPE');
      router.replace('/settings?tab=monetization', { scroll: false });
    }

    if (stripeError && currentTab === 'monetization') {
      toast({
        title: 'Stripe Connection Failed',
        description: `Could not connect Stripe account: ${stripeError}. Please try again.`,
        variant: 'destructive',
      });
      router.replace('/settings?tab=monetization', { scroll: false });
    }

    // Set the active tab from URL params
    if (currentTab) {
      setActiveTab(currentTab);
    }
  }, [searchParams, router, toast, setActiveTab, setEnableDonations, setDonationMethod]);

  return null; // This component doesn't render anything
}

export default function SettingsPage() {
  const { toast } = useToast()
  const { data: session, update, status: sessionStatus } = useSession()
  const router = useRouter();

  // Initialize activeTab correctly
  const [activeTab, setActiveTab] = useState('profile');

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
  const [donationMethod, setDonationMethod] = useState<'PAYPAL' | 'STRIPE' | 'BMC' | 'KOFI' | null>(null);
  const [donationLink, setDonationLink] = useState('');
  const isStripeConnected = donationSettings?.donationMethod === 'STRIPE' && !!donationSettings?.donationLink;
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
          if (userData.preferences) {
            // Check if preferences don't exist or are empty
            const userWithPrefs = session.user as ExtendedUser;
            const hasNoPreferences = !userWithPrefs.preferences ||
                                    Object.keys(userWithPrefs.preferences || {}).length === 0;

            if (hasNoPreferences) {
              await update({
                ...session,
                user: {
                  ...session.user,
                  preferences: userData.preferences,
                }
              });
            }
          }

        } catch (error) {
          logError(error, { context: "Error loading user data" })
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
      setDonationLink(data.donationLink || '');

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
  // Fetch initial donation settings
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchDonationSettings();
    }
    // No redirect needed here as main settings page handles auth
  }, [sessionStatus, toast]); // Depend on sessionStatus
  // --- End Donation Settings Effects ---

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url);
  };

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
         setIsUpdating(false);
         return;
      }

      const response = await fetchWithCsrf("/api/user/profile", {
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
      logError(error, { context: "Error updating profile information" })
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
      const response = await fetchWithCsrf("/api/user/profile", {
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
      logError(error, { context: "Error updating profile image" })
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
      const response = await fetchWithCsrf("/api/user/profile", {
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
      logError(error, { context: "Error updating banner image" })
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

      const response = await fetchWithCsrf("/api/user/profile", {
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
      logError(error, { context: "Error updating social links" })
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
      const response = await fetchWithCsrf("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      })
      const result = await response.json()

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
      logError(error, { context: "Error changing password" })
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

      const response = await fetchWithCsrf("/api/user/delete-account", {
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
      logError(error, { context: "Error deleting account" })
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
    try {
      const response = await fetchWithCsrf('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
         const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to save preferences')
      }

      if (session?.user) {
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

      return true

    } catch (error) {
      logError(error, { context: 'Saving preferences' })
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleNotificationToggle = async (key: keyof UserPreferences['emailNotifications']) => {
    if (!session?.user) return;

    // Initialize preferences if they don't exist
    const userWithPrefs = session.user as ExtendedUser;
    const currentPrefs: UserPreferences = userWithPrefs.preferences || {...defaultPreferences};

    setSavingPreferences(`notification-${key}`);
    try {
      const newPreferences: UserPreferences = {
        ...currentPrefs,
        emailNotifications: {
          ...defaultPreferences.emailNotifications,
          ...(currentPrefs.emailNotifications || {}),
          [key]: !(currentPrefs.emailNotifications?.[key] ?? defaultPreferences.emailNotifications[key]),
        },
      };
      await savePreferences(newPreferences);
      toast({ title: "Preference Updated", description: `Email notification for ${key} updated.` });
    } catch (error) {
       logError(error, { context: `Error updating notification preference ${key}` });
    } finally {
      setSavingPreferences(null);
    }
  }

  const handlePrivacyToggle = async (key: keyof UserPreferences['privacySettings']) => {
    if (!session?.user) return;

    // Initialize preferences if they don't exist
    const userWithPrefs = session.user as ExtendedUser;
    const currentPrefs: UserPreferences = userWithPrefs.preferences || {...defaultPreferences};

    setSavingPreferences(`privacy-${key}`);
    try {
      const newPreferences: UserPreferences = {
        ...currentPrefs,
        privacySettings: {
          ...defaultPreferences.privacySettings,
          ...(currentPrefs.privacySettings || {}),
          [key]: !(currentPrefs.privacySettings?.[key] ?? defaultPreferences.privacySettings[key]),
        },
      };
      await savePreferences(newPreferences);
      toast({ title: "Preference Updated", description: `Privacy setting for ${key} updated.` });
    } catch (error) {
       logError(error, { context: `Error updating privacy preference ${key}` });
    } finally {
      setSavingPreferences(null);
    }
  }

  // --- Donation Settings Handlers (Copied & Renamed) ---
  const handleEnableDonationToggle = (checked: boolean) => {
    setEnableDonations(checked);
    if (!checked) {
      setDonationMethod(null);
      setDonationLink('');
    } else {
      // Default to BMC if enabling and no method is set
      if (!donationMethod) setDonationMethod('BMC');
    }
  };

  const handleDonationMethodChange = (value: string) => {
    setDonationMethod(value as 'PAYPAL' | 'STRIPE' | 'BMC' | 'KOFI');
    setDonationLink(''); // Reset link when method changes
  };

  const handleConnectStripe = async () => {
    setIsSavingDonations(true);
    const clientId = process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/stripe/oauth/callback`;

    if (!clientId) {
        setDonationError('Stripe Client ID is not configured.');
        toast({ title: 'Configuration Error', description: 'Stripe is not configured.', variant: 'destructive' });
        setIsSavingDonations(false);
        return;
    }

    try {
      // Generate a secure random state for CSRF protection
      const stateResponse = await fetch('/api/csrf/generate-state');
      if (!stateResponse.ok) {
        throw new Error('Failed to generate secure state for Stripe Connect');
      }

      const { state } = await stateResponse.json();

      // Set the state in a cookie with a short expiration (10 minutes)
      document.cookie = `stripe_connect_state=${state}; path=/; max-age=600; SameSite=Lax; Secure`;

      // Use standard OAuth flow with the secure state
      const stripeConnectUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&stripe_user[email]=${session?.user?.email || ''}`;
      window.location.href = stripeConnectUrl;
    } catch (error) {
      logError(error, { context: 'Error initiating Stripe Connect flow' });
      setDonationError('Failed to initiate Stripe Connect flow');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initiate Stripe Connect flow',
        variant: 'destructive'
      });
      setIsSavingDonations(false);
    }
  };

  const handleSaveDonationChanges = async (linkOverride?: string) => {
    setIsSavingDonations(true);
    setDonationError(null);

    // Determine the link to save
    const finalLink = linkOverride ?? donationLink;

    try {
      let response: Response | undefined;
      if (!enableDonations) {
        response = await fetchWithCsrf('/api/user/disable-donations', { method: 'POST' });
      } else {
        if (!donationMethod) {
          throw new Error('Please select a valid donation method.');
        }
        
        const payload: { method: string; link?: string } = { method: donationMethod };

        if (donationMethod === 'PAYPAL' || donationMethod === 'BMC' || donationMethod === 'KOFI') {
          payload.link = finalLink;
        }

        response = await fetchWithCsrf('/api/user/enable-donations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
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

      // Refetch settings to get the latest data, including the user ID for webhooks
      await fetchDonationSettings();

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

        {/* Wrap the TabParamsHandler in a Suspense boundary */}
        <Suspense fallback={null}>
          <TabParamsHandler
            toast={toast}
            router={router}
            setActiveTab={setActiveTab}
            setEnableDonations={setEnableDonations}
            setDonationMethod={setDonationMethod}
            donationSettings={donationSettings}
          />
        </Suspense>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
          <div className="overflow-x-auto sm:overflow-x-visible">
            <TabsList className="mb-8 w-max sm:w-auto">
              <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
              <TabsTrigger value="account" className="text-xs sm:text-sm">Account</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notifications</TabsTrigger>
              <TabsTrigger value="privacy" className="text-xs sm:text-sm">Privacy</TabsTrigger>
              <TabsTrigger value="monetization" className="text-xs sm:text-sm">Monetization</TabsTrigger>
            </TabsList>
          </div>

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
              <MonetizationSettings
                session={session}
                donationSettings={donationSettings}
                isLoadingDonations={isLoadingDonations}
                isSavingDonations={isSavingDonations}
                donationError={donationError}
                enableDonations={enableDonations}
                donationMethod={donationMethod}
                donationLink={donationLink}
                setDonationLink={setDonationLink}
                handleEnableDonationToggle={handleEnableDonationToggle}
                handleDonationMethodChange={handleDonationMethodChange}
                handleConnectStripe={handleConnectStripe}
                handleSaveDonationChanges={handleSaveDonationChanges}
                setIsSavingDonations={setIsSavingDonations}
                setDonationError={setDonationError}
              />
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </div>
  )
}
