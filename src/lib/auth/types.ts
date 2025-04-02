import "next-auth";
import { User as PrismaUser } from "@prisma/client";

declare module "next-auth" {
  interface User {
    username?: string | null;
    provider?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string | null;
    provider?: string | null;
  }
} 