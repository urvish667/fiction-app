"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Check, Upload, Trash2, Loader2 } from "lucide-react"
// Import social media icons from a different source to avoid deprecation warnings
import { AtSign, Link, MessageSquare } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Navbar from "@/components/navbar"
// import { User } from "@prisma/client"
import { UserPreferences, defaultPreferences } from "@/types/user"

// Form validation schema
const profileUpdateSchema = z.object({
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
  language: z.enum(["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"]).optional().default("en"),
  theme: z.enum(["light", "dark", "system"]).optional().default("system"),
})

type ProfileFormValues = z.infer<typeof profileUpdateSchema>

// We're using the types defined in src/types/next-auth.d.ts

// We're not extending next-auth types here to avoid conflicts
// The types are already defined in src/types/next-auth.d.ts

export default function SettingsPage() {
  const { toast } = useToast()
  const { data: session, update } = useSession()
  const [activeTab, setActiveTab] = useState("profile")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Initialize form with react-hook-form and zod validation
  const form = useForm({
    resolver: zodResolver(profileUpdateSchema) as any,
    defaultValues: {
      name: session?.user?.name || "",
      username: session?.user?.username || "",
      bio: "",
      location: "",
      website: "",
      socialLinks: {
        twitter: "",
        instagram: "",
        facebook: "",
      },
      language: "en",
      theme: "system",
    },
  })

  // Load user data when session is available
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/user/profile")
          const userData = await response.json()

          if (response.ok) {
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
              language: userData.language || "en",
              theme: userData.theme || "system",
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
  }, [session, form, toast])

  // Handle password form change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  // Save profile information (name, username, bio, etc.)
  const saveProfileInfo = async (data: any) => {
    setIsUpdating(true)

    try {
      // Extract only profile information fields and ensure username is included
      const profileData: Record<string, any> = {
        username: data.username, // Required field
      }

      // Only include fields that are defined
      if (data.name !== undefined) profileData.name = data.name
      if (data.bio !== undefined) profileData.bio = data.bio
      if (data.location !== undefined) profileData.location = data.location
      if (data.website !== undefined) profileData.website = data.website
      if (data.language !== undefined) profileData.language = data.language
      if (data.theme !== undefined) profileData.theme = data.theme

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
            form.setError(key as keyof ProfileFormValues, {
              type: "manual",
              message: value as string,
            })
          })
        }
        throw new Error(result.error || "Failed to update profile information")
      }

      // Update session to reflect changes
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

  // Save social links
  const saveSocialLinks = async (data: any) => {
    setIsUpdating(true)

    try {
      // Extract only social links
      const linksData = {
        username: data.username, // Required field
        socialLinks: data.socialLinks || {},
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
            form.setError(key as keyof ProfileFormValues, {
              type: "manual",
              message: value as string,
            })
          })
        }
        throw new Error(result.error || "Failed to update social links")
      }

      // Update session to reflect changes
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

  // Change password
  const changePassword = () => {
    // Validate password
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)

    // Simulate API call
    setTimeout(() => {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      })

      setIsChangingPassword(false)
    }, 1000)
  }

  // Update the notification toggle handler
  const handleNotificationToggle = async (key: keyof UserPreferences['emailNotifications']) => {
    if (!session?.user?.preferences) return;

    const newPreferences: UserPreferences = {
      emailNotifications: {
        ...defaultPreferences.emailNotifications,
        ...session.user.preferences.emailNotifications,
        [key]: !session.user.preferences.emailNotifications?.[key],
      },
      privacySettings: {
        ...defaultPreferences.privacySettings,
        ...session.user.preferences.privacySettings,
      },
    }

    // Save the updated preferences
    await savePreferences(newPreferences);
  }

  // Update the privacy toggle handler
  const handlePrivacyToggle = async (key: keyof UserPreferences['privacySettings']) => {
    if (!session?.user?.preferences) return;

    const newPreferences: UserPreferences = {
      emailNotifications: {
        ...defaultPreferences.emailNotifications,
        ...session.user.preferences.emailNotifications,
      },
      privacySettings: {
        ...defaultPreferences.privacySettings,
        ...session.user.preferences.privacySettings,
        [key]: !session.user.preferences.privacySettings?.[key],
      },
    }

    // Save the updated preferences
    await savePreferences(newPreferences);
  }

  // Update the savePreferences function to take preferences as parameter
  const savePreferences = async (preferences: UserPreferences) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      toast({
        title: "Success",
        description: "Your preferences have been updated.",
      })

      // Refresh the session to get updated preferences
      await update()
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      })
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

          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Profile Information */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                          id="name"
                          {...form.register("name")}
                          aria-invalid={!!form.formState.errors.name}
                        />
                        {form.formState.errors.name && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          {...form.register("username")}
                          aria-invalid={!!form.formState.errors.username}
                        />
                        {form.formState.errors.username && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {form.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        {...form.register("bio")}
                        rows={4}
                        aria-invalid={!!form.formState.errors.bio}
                      />
                      <p className="text-xs text-muted-foreground">
                        Brief description for your profile. Maximum 500 characters.
                      </p>
                      {form.formState.errors.bio && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {form.formState.errors.bio.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          {...form.register("location")}
                          aria-invalid={!!form.formState.errors.location}
                        />
                        {form.formState.errors.location && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {form.formState.errors.location.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          {...form.register("website")}
                          placeholder="https://"
                          aria-invalid={!!form.formState.errors.website}
                        />
                        {form.formState.errors.website && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {form.formState.errors.website.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={form.handleSubmit(saveProfileInfo)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Social Links */}
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Social Links</CardTitle>
                    <CardDescription>Connect your social media accounts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="flex items-center gap-2">
                        <AtSign className="h-4 w-4" />
                        Twitter
                      </Label>
                      <Input
                        id="twitter"
                        {...form.register("socialLinks.twitter")}
                        placeholder="https://twitter.com/username"
                        aria-invalid={!!form.formState.errors.socialLinks?.twitter}
                      />
                      {form.formState.errors.socialLinks?.twitter && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {form.formState.errors.socialLinks.twitter.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        {...form.register("socialLinks.instagram")}
                        placeholder="https://instagram.com/username"
                        aria-invalid={!!form.formState.errors.socialLinks?.instagram}
                      />
                      {form.formState.errors.socialLinks?.instagram && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {form.formState.errors.socialLinks.instagram.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Facebook
                      </Label>
                      <Input
                        id="facebook"
                        {...form.register("socialLinks.facebook")}
                        placeholder="https://facebook.com/username"
                        aria-invalid={!!form.formState.errors.socialLinks?.facebook}
                      />
                      {form.formState.errors.socialLinks?.facebook && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {form.formState.errors.socialLinks.facebook.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={form.handleSubmit(saveSocialLinks)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Save Links
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Profile Picture & Banner */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                    <CardDescription>Upload a new profile picture</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                      <AvatarFallback>{session?.user?.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>

                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Recommended: Square image, at least 400x400 pixels.
                    </p>
                  </CardContent>
                </Card>

                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Profile Banner</CardTitle>
                    <CardDescription>Upload a new profile banner</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="relative w-full h-32 rounded-md overflow-hidden mb-4">
                      <Image
                        src="/placeholder.svg"
                        alt="Profile banner"
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4 text-center">Recommended: 1200x300 pixels.</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="account">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Email Settings */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Email Address</CardTitle>
                  <CardDescription>Update your email address</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={session?.user?.email || ""} disabled />
                    <p className="text-xs text-muted-foreground">To change your email, please contact support.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Password Settings */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={changePassword}
                    disabled={
                      isChangingPassword ||
                      !passwordForm.currentPassword ||
                      !passwordForm.newPassword ||
                      !passwordForm.confirmPassword
                    }
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions for your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Once you delete your account, there is no going back. This action is permanent.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="destructive">Delete Account</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>Manage your email notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="newFollower">New Follower</Label>
                      <p className="text-sm text-muted-foreground">Receive an email when someone follows you</p>
                    </div>
                    <Switch
                      id="newFollower"
                      checked={session?.user?.preferences?.emailNotifications?.newFollower ?? defaultPreferences.emailNotifications.newFollower}
                      onCheckedChange={() => handleNotificationToggle("newFollower")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="newComment">New Comment</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive an email when someone comments on your story
                      </p>
                    </div>
                    <Switch
                      id="newComment"
                      checked={session?.user?.preferences?.emailNotifications?.newComment ?? defaultPreferences.emailNotifications.newComment}
                      onCheckedChange={() => handleNotificationToggle("newComment")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="newLike">New Like</Label>
                      <p className="text-sm text-muted-foreground">Receive an email when someone likes your story</p>
                    </div>
                    <Switch
                      id="newLike"
                      checked={session?.user?.preferences?.emailNotifications?.newLike ?? defaultPreferences.emailNotifications.newLike}
                      onCheckedChange={() => handleNotificationToggle("newLike")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="newChapter">New Chapter</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive an email when an author you follow publishes a new chapter
                      </p>
                    </div>
                    <Switch
                      id="newChapter"
                      checked={session?.user?.preferences?.emailNotifications?.newChapter ?? defaultPreferences.emailNotifications.newChapter}
                      onCheckedChange={() => handleNotificationToggle("newChapter")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive emails about new features, tips, and promotions
                      </p>
                    </div>
                    <Switch
                      id="marketing"
                      checked={!!(session?.user as any)?.marketingOptIn}
                      onCheckedChange={async () => {
                        try {
                          // Use type assertion to handle marketingOptIn
                          const userData = session?.user as any;
                          const response = await fetch('/api/user/profile', {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              username: userData.username,
                              marketingOptIn: !userData.marketingOptIn,
                            }),
                          })

                          if (!response.ok) {
                            throw new Error('Failed to update marketing preferences')
                          }

                          toast({
                            title: "Success",
                            description: "Your marketing preferences have been updated.",
                          })

                          // Refresh the session to get updated preferences
                          await update()
                        } catch (error) {
                          console.error('Error updating marketing preferences:', error)
                          toast({
                            title: "Error",
                            description: "Failed to update marketing preferences. Please try again.",
                            variant: "destructive",
                          })
                        }
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={() => savePreferences(session?.user?.preferences ?? defaultPreferences)}>
                    Save Notification Preferences
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="privacy">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Manage your privacy preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="publicProfile">Public Profile</Label>
                      <p className="text-sm text-muted-foreground">Make your profile visible to everyone</p>
                    </div>
                    <Switch
                      id="publicProfile"
                      checked={session?.user?.preferences?.privacySettings?.publicProfile ?? defaultPreferences.privacySettings.publicProfile}
                      onCheckedChange={() => handlePrivacyToggle("publicProfile")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showEmail">Show Email</Label>
                      <p className="text-sm text-muted-foreground">Display your email address on your public profile</p>
                    </div>
                    <Switch
                      id="showEmail"
                      checked={session?.user?.preferences?.privacySettings?.showEmail ?? defaultPreferences.privacySettings.showEmail}
                      onCheckedChange={() => handlePrivacyToggle("showEmail")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showLocation">Show Location</Label>
                      <p className="text-sm text-muted-foreground">Display your location on your public profile</p>
                    </div>
                    <Switch
                      id="showLocation"
                      checked={session?.user?.preferences?.privacySettings?.showLocation ?? defaultPreferences.privacySettings.showLocation}
                      onCheckedChange={() => handlePrivacyToggle("showLocation")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowMessages">Allow Messages</Label>
                      <p className="text-sm text-muted-foreground">Allow other users to send you direct messages</p>
                    </div>
                    <Switch
                      id="allowMessages"
                      checked={session?.user?.preferences?.privacySettings?.allowMessages ?? defaultPreferences.privacySettings.allowMessages}
                      onCheckedChange={() => handlePrivacyToggle("allowMessages")}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={() => savePreferences(session?.user?.preferences ?? defaultPreferences)}>
                    Save Privacy Preferences
                  </Button>
                </CardFooter>
              </Card>

              <div className="mt-8 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Privacy Policy</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      By using FableSpace, you agree to our Privacy Policy. We respect your privacy and are committed to
                      protecting your personal information.
                    </p>
                    <Button variant="link" className="px-0 h-auto text-sm">
                      Read our Privacy Policy
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Global save button removed */}
      </main>
    </div>
  )
}

