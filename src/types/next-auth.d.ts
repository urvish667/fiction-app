import type { UserPreferences } from "./user";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
      birthdate?: string | number | Date | null;
      isProfileComplete?: boolean;
      unreadNotifications: number;
      preferences?: UserPreferences;
      emailVerified?: Date | null;
    };
    expires: string;
  }

  interface User {
    username?: string | null;
    birthdate?: Date | null;
    isProfileComplete?: boolean;
    preferences?: UserPreferences;
    needsProfileCompletion?: boolean;
    emailVerified?: Date | null;
    provider?: string | null;
    unreadNotifications?: number;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    id?: string;
    username?: string | null;
    birthdate?: Date | null;
    isProfileComplete?: boolean;
    preferences?: UserPreferences;
    lastUpdated?: number;
    needsProfileCompletion?: boolean;
    bannerImage?: string | null;
    provider?: string;
    marketingOptIn?: boolean;
    unreadNotifications?: number;
    emailVerified?: Date | null;
  }
}
