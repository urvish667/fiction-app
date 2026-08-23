import { z } from "zod";
import type { UserPreferences } from "@/types/user";

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

export interface ExtendedSession {
  user: ExtendedUser;
  expires: string;
}

export const settingsFormSchema = z.object({
  name: z.string().max(50, "Name is too long").optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  location: z.string().max(100, "Location must be less than 100 characters").optional().nullable(),
  website: z.union([z.literal(""), z.string().url("Please enter a valid URL")]).optional().nullable(),
  socialLinks: z
    .object({
      twitter: z.union([z.literal(""), z.string().url("Please enter a valid URL")]).optional().nullable(),
      instagram: z.union([z.literal(""), z.string().url("Please enter a valid URL")]).optional().nullable(),
      facebook: z.union([z.literal(""), z.string().url("Please enter a valid URL")]).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
export type ProfileFormValuesSubset = SettingsFormValues;

export interface DonationSettingsData {
  id?: string;
  donationsEnabled: boolean;
  donationMethod: "PAYPAL" | "STRIPE" | "BMC" | "KOFI" | null;
  donationLink: string | null;
}
