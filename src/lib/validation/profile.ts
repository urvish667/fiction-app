import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
  username: z.string()
          .min(3, "Username must be at least 3 characters")
          .max(30, "Username must be less than 30 characters")
          .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  website: z.union([z.literal(''), z.string().url("Please enter a valid URL")]).optional().nullable(),
  socialLinks: z.object({
    twitter: z.union([z.literal(''), z.string().url("Please enter a valid Twitter URL"), z.null()]).optional().nullable(),
    instagram: z.union([z.literal(''), z.string().url("Please enter a valid Instagram URL"), z.null()]).optional().nullable(),
    facebook: z.union([z.literal(''), z.string().url("Please enter a valid Facebook URL"), z.null()]).optional().nullable(),
  }).optional(),
  language: z.string().optional(),
  theme: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
  image: z.string().optional(),
  bannerImage: z.string().optional(),
});
