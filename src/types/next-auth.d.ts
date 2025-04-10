import "next-auth"
import { User as PrismaUser } from "@prisma/client"
import { UserPreferences } from "./user"

declare module "next-auth" {
  interface User extends Omit<PrismaUser, "preferences"> {
    preferences?: UserPreferences
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      bannerImage?: string | null
      username?: string | null
      isProfileComplete?: boolean
      unreadNotifications: number
      preferences?: UserPreferences
      marketingOptIn?: boolean
      provider?: string
    }
    expires: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username?: string | null
    isProfileComplete?: boolean
    unreadNotifications: number
    preferences?: UserPreferences
    marketingOptIn?: boolean
    provider?: string
    bannerImage?: string | null
  }
}