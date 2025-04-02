import "next-auth";
import { User as PrismaUser } from "@prisma/client";

declare module "next-auth" {
  interface User {
    username?: string | null;
    provider?: string | null;
    isProfileComplete?: boolean;
    unreadNotifications?: number;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
      isProfileComplete?: boolean;
      unreadNotifications: number;
    };
    expires: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
    provider?: string | null;
    isProfileComplete?: boolean;
    unreadNotifications?: number;
  }
} 