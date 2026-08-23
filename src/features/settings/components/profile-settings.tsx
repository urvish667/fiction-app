"use client";

import type React from "react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ExtendedSession, ProfileFormValuesSubset } from "../types/settings.types";
import { ProfileInfoForm } from "./profile/profile-info-form";
import { SocialLinksForm } from "./profile/social-links-form";
import { ProfileImageUpload } from "./profile/profile-image-upload";
import { BannerImageUpload } from "./profile/banner-image-upload";

interface ProfileSettingsProps {
  session: ExtendedSession | null;
  form: UseFormReturn<ProfileFormValuesSubset>;
  isUpdating: boolean;
  saveProfileInfo: (
    data: Partial<Pick<ProfileFormValuesSubset, "name" | "username" | "bio" | "location" | "website">>
  ) => Promise<void>;
  saveSocialLinks: (data: Pick<ProfileFormValuesSubset, "username" | "socialLinks">) => Promise<void>;
  updateProfileImage?: (imageUrl: string) => Promise<void>;
  updateBannerImage?: (imageUrl: string) => Promise<void>;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  session,
  form,
  isUpdating,
  saveProfileInfo,
  saveSocialLinks,
  updateProfileImage,
  updateBannerImage,
}) => {
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

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
  );
};

export default ProfileSettings;
