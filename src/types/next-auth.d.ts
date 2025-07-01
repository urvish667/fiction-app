import type { UserPreferences } from "./user";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
      isProfileComplete?: boolean;
      unreadNotifications: number;
      preferences?: UserPreferences;
    } & {
      id: string;
    };
  }

  interface User {
    username?: string | null;
    isProfileComplete?: boolean;
    preferences?: UserPreferences;
    needsProfileCompletion?: boolean;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    id?: string;
    username?: string | null;
    isProfileComplete?: boolean;
    preferences?: UserPreferences;
    lastUpdated?: number;
    needsProfileCompletion?: boolean;
    bannerImage?: string | null;
    provider?: string;
    marketingOptIn?: boolean;
    unreadNotifications?: number;
  }
}
