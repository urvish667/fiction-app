import type React from "react"
import type { UseFormReturn } from "react-hook-form"
import type { Session } from "next-auth"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, Check, Upload, Trash2, Loader2, AtSign, Link, MessageSquare } from "lucide-react"
import { z } from "zod"

// Define the schema subset needed for profile validation within this component
const profileUpdateSchemaSubset = z.object({
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
})

type ProfileFormValuesSubset = z.infer<typeof profileUpdateSchemaSubset>

interface ProfileSettingsProps {
  session: Session | null
  form: UseFormReturn<ProfileFormValuesSubset>
  isUpdating: boolean
  saveProfileInfo: (data: any) => Promise<void>
  saveSocialLinks: (data: any) => Promise<void>
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  session,
  form,
  isUpdating,
  saveProfileInfo,
  saveSocialLinks,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                    {form.formState.errors.name.message?.toString()}
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
                    {form.formState.errors.username.message?.toString()}
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
                  {form.formState.errors.bio.message?.toString()}
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
                    {form.formState.errors.location.message?.toString()}
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
                    {form.formState.errors.website.message?.toString()}
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
                aria-invalid={!!form.formState.errors?.socialLinks?.twitter}
              />
              {form.formState.errors?.socialLinks?.twitter && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {(form.formState.errors.socialLinks as any)?.twitter?.message?.toString()}
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
                aria-invalid={!!form.formState.errors?.socialLinks?.instagram}
              />
              {form.formState.errors?.socialLinks?.instagram && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {(form.formState.errors.socialLinks as any)?.instagram?.message?.toString()}
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
                aria-invalid={!!form.formState.errors?.socialLinks?.facebook}
              />
              {form.formState.errors?.socialLinks?.facebook && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {(form.formState.errors.socialLinks as any)?.facebook?.message?.toString()}
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
                src="/placeholder.svg" // Placeholder for banner - replace if dynamic banner exists
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
    </div>
  )
}

export default ProfileSettings 