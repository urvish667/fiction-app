import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  username: z.string().min(3, "Username must be at least 3 characters long").max(50, "Username is too long").optional(),
  bio: z.string().max(200, "Bio is too long").optional(),
  location: z.string().max(100, "Location is too long").optional(),
  website: z.string().url("Invalid URL").max(100, "Website URL is too long").optional(),
  socialLinks: z.array(z.string().url()).max(5, "You can add up to 5 social links").optional(),
  language: z.string().optional(),
  theme: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
  image: z.string().url().optional(),
  bannerImage: z.string().url().optional(),
});
