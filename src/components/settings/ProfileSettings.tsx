import type React from "react"
import { useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { Session } from "next-auth"
import { UserPreferences } from "@/types/user"
import { z } from "zod"

// Define a custom type for the session user that includes bannerImage
export interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bannerImage?: string | null;
  username?: string | null;
  isProfileComplete?: boolean;
  unreadNotifications: number;
  preferences?: UserPreferences;
  marketingOptIn?: boolean;
  provider?: string;
}

// Extend the Session type to include our ExtendedUser
export interface ExtendedSession extends Omit<Session, 'user'> {
  user: ExtendedUser;
}

// Define the schema subset needed for profile validation within this component
// Update your Zod schema for social links
const profileUpdateSchemaSubset = z.object({
  name: z.string().max(50, "Name is too long").optional(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  location: z.string().max(100, "Location must be less than 100 characters").optional().nullable(),
  website: z.union([z.literal(''), z.string().url("Please enter a valid URL")]).optional().nullable(),
  socialLinks: z.object({
    twitter: z.union([z.literal(''), z.string().url("Please enter a valid Twitter URL")]).optional().nullable(),
    instagram: z.union([z.literal(''), z.string().url("Please enter a valid Instagram URL")]).optional().nullable(),
    facebook: z.union([z.literal(''), z.string().url("Please enter a valid Facebook URL")]).optional().nullable(),
  }).optional().nullable(),
})

export type ProfileFormValuesSubset = z.infer<typeof profileUpdateSchemaSubset>

interface ProfileSettingsProps {
  session: ExtendedSession | null
  form: UseFormReturn<ProfileFormValuesSubset>
  isUpdating: boolean
  saveProfileInfo: (data: Partial<Pick<ProfileFormValuesSubset, 'name' | 'username' | 'bio' | 'location' | 'website'>>) => Promise<void>
  saveSocialLinks: (data: Pick<ProfileFormValuesSubset, 'username' | 'socialLinks'>) => Promise<void>
  updateProfileImage?: (imageUrl: string) => Promise<void>
  updateBannerImage?: (imageUrl: string) => Promise<void>
}

// Import sub-components
import { ProfileInfoForm } from "./profile/ProfileInfoForm"
import { SocialLinksForm } from "./profile/SocialLinksForm"
import { ProfileImageUpload } from "./profile/ProfileImageUpload"
import { BannerImageUpload } from "./profile/BannerImageUpload"

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  session,
  form,
  isUpdating,
  saveProfileInfo,
  saveSocialLinks,
  updateProfileImage,
  updateBannerImage,
}) => {
  const [isUploadingProfile, setIsUploadingProfile] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Profile Information + Social Links Column*/}
      <div className="md:col-span-2 space-y-6">
        <ProfileInfoForm
          form={form}
          isUpdating={isUpdating}
          saveProfileInfo={saveProfileInfo}
        />

        <SocialLinksForm
          form={form}
          isUpdating={isUpdating}
          saveSocialLinks={saveSocialLinks}
        />
      </div>

      {/* Profile Picture & Banner */}
      <div>
        <ProfileImageUpload
          session={session}
          isUploading={isUploadingProfile}
          setIsUploading={setIsUploadingProfile}
          updateProfileImage={updateProfileImage}
        />

        <BannerImageUpload
          session={session}
          isUploading={isUploadingBanner}
          setIsUploading={setIsUploadingBanner}
          updateBannerImage={updateBannerImage}
          className="mt-8"
        />
      </div>
    </div>
  )
}

export default ProfileSettings