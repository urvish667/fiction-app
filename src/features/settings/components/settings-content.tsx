"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPreferences, defaultPreferences } from "@/types/user";
import { useRouter, useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/features/auth";
import { UserService, type ProfileUpdateData } from "@/lib/api/user";
import { logError } from "@/lib/error-logger";

import { ProfileSettings } from "./profile-settings";
import { AccountSettings } from "./account-settings";
import { NotificationSettings } from "./notification-settings";
import { PrivacySettings } from "./privacy-settings";
import { MonetizationSettings } from "./monetization-settings";
import {
  settingsFormSchema,
  type SettingsFormValues,
  type DonationSettingsData,
  type ExtendedSession,
} from "../types/settings.types";

function TabParamsHandler({
  toast,
  router,
  setActiveTab,
  setEnableDonations,
  setDonationMethod,
}: {
  toast: any;
  router: any;
  setActiveTab: (tab: string) => void;
  setEnableDonations: (enabled: boolean) => void;
  setDonationMethod: (method: "PAYPAL" | "STRIPE" | "BMC" | "KOFI" | null) => void;
  donationSettings: DonationSettingsData | null;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    const stripeSuccess = searchParams.get("success");
    const stripeError = searchParams.get("error");
    const currentTab = searchParams.get("tab");

    if (stripeSuccess === "stripe_connected" && currentTab === "monetization") {
      toast({
        title: "Success!",
        description: "Your Stripe account has been connected successfully.",
      });
      setEnableDonations(true);
      setDonationMethod("STRIPE");
      router.replace("/settings?tab=monetization", { scroll: false });
    }

    if (stripeError && currentTab === "monetization") {
      toast({
        title: "Stripe Connection Failed",
        description: `Could not connect Stripe account: ${stripeError}. Please try again.`,
        variant: "destructive",
      });
      router.replace("/settings?tab=monetization", { scroll: false });
    }

    if (currentTab) {
      setActiveTab(currentTab);
    }
  }, [searchParams, router, toast, setActiveTab, setEnableDonations, setDonationMethod]);

  return null;
}

export function SettingsContent() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useRequireAuth();
  const { refreshUser, logout } = useAuth();
  const router = useRouter();

  const session: ExtendedSession | null = user
    ? {
        user: {
          ...user,
          bannerImage: user.bannerImage || null,
          isProfileComplete: user.isProfileComplete || false,
          unreadNotifications: user.unreadNotifications || 0,
          preferences: user.preferences || {},
          marketingOptIn: user.marketingOptIn || false,
          provider: "credentials",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    : null;

  const sessionStatus = isAuthenticated ? "authenticated" : isLoading ? "loading" : "unauthenticated";

  const update = async () => {
    await refreshUser();
  };

  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [savingPreferences, setSavingPreferences] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [donationSettings, setDonationSettings] = useState<DonationSettingsData | null>(null);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);
  const [isSavingDonations, setIsSavingDonations] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);
  const [enableDonations, setEnableDonations] = useState(false);
  const [donationMethod, setDonationMethod] = useState<"PAYPAL" | "STRIPE" | "BMC" | "KOFI" | null>(null);
  const [donationLink, setDonationLink] = useState("");

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
  });

  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user || formInitialized) return;

    const loadUserData = async () => {
      try {
        const profileResponse = await UserService.getCurrentUserProfile();
        if (!profileResponse.success || !profileResponse.data) {
          throw new Error("Failed to fetch profile data");
        }
        const userData = profileResponse.data;

        form.reset({
          name: userData.name || "",
          username: userData.username || "",
          bio: userData.bio || "",
          location: userData.location || "",
          website: userData.website || "",
        });

        form.setValue("socialLinks.twitter", userData.socialLinks?.twitter || "");
        form.setValue("socialLinks.instagram", userData.socialLinks?.instagram || "");
        form.setValue("socialLinks.facebook", userData.socialLinks?.facebook || "");

        setFormInitialized(true);
      } catch (error) {
        logError(error, { context: "Error loading user data" });
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      }
    };

    loadUserData();
  }, [isAuthenticated, user, formInitialized, form, toast]);

  const fetchDonationSettings = async () => {
    setIsLoadingDonations(true);
    setDonationError(null);
    try {
      const response = await UserService.getDonationSettings();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch donation settings.");
      }
      const data: DonationSettingsData = response.data;
      setDonationSettings(data);
      setEnableDonations(data.donationsEnabled);
      setDonationMethod(data.donationMethod);
      setDonationLink(data.donationLink || "");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
      setDonationError(errorMsg);
      toast({
        title: "Error Loading Donation Settings",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoadingDonations(false);
    }
  };

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetchDonationSettings();
  }, [sessionStatus]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.pushState({}, "", url);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfileInfo = async (data: Partial<SettingsFormValues>) => {
    setIsUpdating(true);
    try {
      const profileData: Record<string, any> = {};
      if (data.username) profileData.username = data.username;
      if (data.name !== undefined) profileData.name = data.name;
      if (data.bio !== undefined) profileData.bio = data.bio;
      if (data.location !== undefined) profileData.location = data.location;
      if (data.website !== undefined) profileData.website = data.website;

      const hasNoChanges =
        Object.keys(profileData).length === 0 ||
        (Object.keys(profileData).length === 1 && profileData.username === session?.user?.username);

      if (hasNoChanges) {
        setIsUpdating(false);
        return;
      }

      const response = await UserService.updateCurrentUserProfile(profileData as ProfileUpdateData);

      if (!response.success) {
        if (response.message) {
          form.setError("root", { type: "manual", message: response.message });
        }
        throw new Error(response.message || "Failed to update profile information");
      }

      await update();
      toast({
        title: "Success",
        description: "Your profile information has been updated",
      });
    } catch (error) {
      logError(error, { context: "Error updating profile information" });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile information",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateProfileImage = async (imageUrl: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await UserService.updateCurrentUserProfile({
        image: imageUrl,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update profile image");
      }

      await update();
      window.location.reload();
    } catch (error) {
      logError(error, { context: "Error updating profile image" });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile image",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBannerImage = async (imageUrl: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await UserService.updateCurrentUserProfile({
        bannerImage: imageUrl,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update banner image");
      }

      await update();
      window.location.reload();
    } catch (error) {
      logError(error, { context: "Error updating banner image" });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update banner image",
        variant: "destructive",
      });
      throw error;
    }
  };

  const saveSocialLinks = async (data: Pick<SettingsFormValues, "username" | "socialLinks">) => {
    setIsUpdating(true);
    try {
      const linksData: Record<string, any> = {
        socialLinks: data.socialLinks || {},
      };

      if (data.username && data.username !== session?.user?.username) {
        linksData.username = data.username;
      }

      const response = await UserService.updateCurrentUserProfile(linksData as ProfileUpdateData);

      if (!response.success) {
        if (response.message && response.message.includes("social")) {
          toast({
            title: "Error",
            description: response.message,
            variant: "destructive",
          });
          return;
        }
        throw new Error(response.message || "Failed to update social links");
      }

      await update();
      toast({
        title: "Success",
        description: "Your social links have been updated",
      });
    } catch (error) {
      logError(error, { context: "Error updating social links" });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update social links",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword.length < 8) {
      toast({ title: "Password too short", description: "New password must be at least 8 characters long.", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirm password must match.", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast({ title: "Same password", description: "New password must be different from your current password.", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await UserService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to change password");
      }

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({
        title: "Password Changed Successfully",
        description: "Your password has been updated.",
        variant: "default",
        duration: 5000,
      });
    } catch (error) {
      logError(error, { context: "Error changing password" });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const password = session?.user?.provider === "credentials" ? deletePassword : undefined;
      const response = await UserService.deleteAccount(password);

      if (!response.success) {
        throw new Error(response.message || "Failed to delete account");
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
        variant: "default",
      });
      await logout();
      router.push("/");
    } catch (error) {
      logError(error, { context: "Error deleting account" });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const savePreferences = async (preferences: UserPreferences) => {
    try {
      const response = await UserService.updateUserPreferences(preferences);

      if (!response.success) {
        throw new Error(response.message || "Failed to save preferences");
      }

      await update();
      return true;
    } catch (error) {
      logError(error, { context: "Saving preferences" });
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleNotificationToggle = async (key: keyof UserPreferences["emailNotifications"]) => {
    if (!session?.user) return;

    const currentPrefs: UserPreferences = session.user.preferences || { ...defaultPreferences };

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
  };

  const handlePrivacyToggle = async (key: keyof UserPreferences["privacySettings"]) => {
    if (!session?.user) return;

    const currentPrefs: UserPreferences = session.user.preferences || { ...defaultPreferences };

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
  };

  const handleEnableDonationToggle = (checked: boolean) => {
    setEnableDonations(checked);
    if (!checked) {
      setDonationMethod(null);
      setDonationLink("");
      return;
    }

    if (!donationMethod) {
      setDonationMethod("BMC");
    }
  };

  const handleDonationMethodChange = (value: string) => {
    setDonationMethod(value as "PAYPAL" | "STRIPE" | "BMC" | "KOFI");
    setDonationLink("");
  };

  const handleConnectStripe = async () => {
    // For future implementation
  };

  const handleSaveDonationChanges = async (linkOverride?: string) => {
    setIsSavingDonations(true);
    setDonationError(null);

    const finalLink = linkOverride ?? donationLink;

    try {
      let response;
      if (!enableDonations) {
        response = await UserService.disableDonations();
      } else {
        if (!donationMethod) {
          throw new Error("Please select a valid donation method.");
        }

        response = await UserService.enableDonations(donationMethod, finalLink);
      }

      if (!response.success) {
        throw new Error(response.message || "Failed to update donation settings.");
      }

      toast({ title: "Success", description: response.message || "Settings updated." });
      await fetchDonationSettings();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setDonationError(errorMessage);
      toast({ title: "Error Saving Settings", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSavingDonations(false);
    }
  };

  return (
    <>
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
              session={session}
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
    </>
  );
}
