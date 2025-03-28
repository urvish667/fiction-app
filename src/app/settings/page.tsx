"use client"

import type React from "react"

import { useState } from "react"
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
import { AlertCircle, Check, Upload, Trash2, Facebook, Twitter, Instagram, Github, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Navbar from "@/components/navbar"

// Mock user data
const mockUser = {
  id: "user_1",
  name: "James Watson",
  username: "jwatson213",
  email: "james.watson@example.com",
  bio: "Fiction writer with a passion for fantasy and sci-fi. Creating worlds one story at a time.",
  location: "San Francisco, CA",
  website: "https://jameswatson.com",
  avatar: "/placeholder-user.jpg",
  banner: "/placeholder.svg?height=300&width=1200",
  socialLinks: {
    twitter: "https://twitter.com/jwatson",
    facebook: "https://facebook.com/jwatson",
    instagram: "https://instagram.com/jwatson",
    github: "",
  },
  preferences: {
    emailNotifications: {
      newFollower: true,
      newComment: true,
      newLike: false,
      newChapter: true,
      marketing: false,
    },
    privacySettings: {
      publicProfile: true,
      showEmail: false,
      showLocation: true,
      allowMessages: true,
    },
  },
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [user, setUser] = useState(mockUser)
  const [activeTab, setActiveTab] = useState("profile")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    username: user.username,
    bio: user.bio,
    location: user.location,
    website: user.website,
  })

  const [socialForm, setSocialForm] = useState({
    twitter: user.socialLinks.twitter,
    facebook: user.socialLinks.facebook,
    instagram: user.socialLinks.instagram,
    github: user.socialLinks.github,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Handle profile form change
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle social form change
  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSocialForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle password form change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle notification toggle
  const handleNotificationToggle = (key: keyof typeof user.preferences.emailNotifications) => {
    setUser((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        emailNotifications: {
          ...prev.preferences.emailNotifications,
          [key]: !prev.preferences.emailNotifications[key],
        },
      },
    }))
  }

  // Handle privacy toggle
  const handlePrivacyToggle = (key: keyof typeof user.preferences.privacySettings) => {
    setUser((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        privacySettings: {
          ...prev.preferences.privacySettings,
          [key]: !prev.preferences.privacySettings[key],
        },
      },
    }))
  }

  // Save profile
  const saveProfile = () => {
    setIsUpdating(true)

    // Simulate API call
    setTimeout(() => {
      setUser((prev) => ({
        ...prev,
        name: profileForm.name,
        username: profileForm.username,
        bio: profileForm.bio,
        location: profileForm.location,
        website: profileForm.website,
      }))

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      setIsUpdating(false)
    }, 1000)
  }

  // Save social links
  const saveSocialLinks = () => {
    setIsUpdating(true)

    // Simulate API call
    setTimeout(() => {
      setUser((prev) => ({
        ...prev,
        socialLinks: {
          twitter: socialForm.twitter,
          facebook: socialForm.facebook,
          instagram: socialForm.instagram,
          github: socialForm.github,
        },
      }))

      toast({
        title: "Social links updated",
        description: "Your social links have been updated successfully.",
      })

      setIsUpdating(false)
    }, 1000)
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

  // Save notification preferences
  const saveNotificationPreferences = () => {
    setIsUpdating(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Notification preferences updated",
        description: "Your notification preferences have been updated successfully.",
      })

      setIsUpdating(false)
    }, 1000)
  }

  // Save privacy settings
  const savePrivacySettings = () => {
    setIsUpdating(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Privacy settings updated",
        description: "Your privacy settings have been updated successfully.",
      })

      setIsUpdating(false)
    }, 1000)
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
                        <Input id="name" name="name" value={profileForm.name} onChange={handleProfileChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          value={profileForm.username}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" name="bio" value={profileForm.bio} onChange={handleProfileChange} rows={4} />
                      <p className="text-xs text-muted-foreground">
                        Brief description for your profile. Maximum 160 characters.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          name="location"
                          value={profileForm.location}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" name="website" value={profileForm.website} onChange={handleProfileChange} />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={saveProfile} disabled={isUpdating}>
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
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </Label>
                      <Input
                        id="twitter"
                        name="twitter"
                        value={socialForm.twitter}
                        onChange={handleSocialChange}
                        placeholder="https://twitter.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </Label>
                      <Input
                        id="facebook"
                        name="facebook"
                        value={socialForm.facebook}
                        onChange={handleSocialChange}
                        placeholder="https://facebook.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        value={socialForm.instagram}
                        onChange={handleSocialChange}
                        placeholder="https://instagram.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="github" className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        GitHub
                      </Label>
                      <Input
                        id="github"
                        name="github"
                        value={socialForm.github}
                        onChange={handleSocialChange}
                        placeholder="https://github.com/username"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={saveSocialLinks} disabled={isUpdating}>
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
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
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
                        src={user.banner || "/placeholder.svg"}
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
                    <Input id="email" type="email" value={user.email} disabled />
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
                      checked={user.preferences.emailNotifications.newFollower}
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
                      checked={user.preferences.emailNotifications.newComment}
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
                      checked={user.preferences.emailNotifications.newLike}
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
                      checked={user.preferences.emailNotifications.newChapter}
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
                      checked={user.preferences.emailNotifications.marketing}
                      onCheckedChange={() => handleNotificationToggle("marketing")}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={saveNotificationPreferences} disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
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
                      checked={user.preferences.privacySettings.publicProfile}
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
                      checked={user.preferences.privacySettings.showEmail}
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
                      checked={user.preferences.privacySettings.showLocation}
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
                      checked={user.preferences.privacySettings.allowMessages}
                      onCheckedChange={() => handlePrivacyToggle("allowMessages")}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={savePrivacySettings} disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
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
      </main>
    </div>
  )
}

