import { PrismaAdapter } from "@auth/prisma-adapter";
import { handleOAuthUser } from "./auth-utils";
import { prisma } from "../prisma";

// Re-export the prisma client for backward compatibility
// This ensures existing imports from @/lib/auth/db-adapter still work
export { prisma };

export function getPrismaAdapter() {
  const adapter = PrismaAdapter(prisma);

  // Create a type-safe version by casting
  const typedAdapter = adapter as any;

  // Store original function before overriding
  const originalCreateUser = typedAdapter.createUser;

  // Override the createUser function to handle OAuth users
  typedAdapter.createUser = async (data: any) => {
    // For OAuth users (check for provider in account data)
    const accountData = data._profile?.account || data._profile || {};

    if (accountData.provider) {
      return handleOAuthUser({
        email: data.email || "",
        name: data.name || undefined,
        image: data.image || undefined,
        provider: accountData.provider,
        providerAccountId: accountData.providerAccountId || "",
        access_token: accountData.access_token,
        expires_at: accountData.expires_at,
        refresh_token: accountData.refresh_token,
        token_type: accountData.token_type,
        scope: accountData.scope,
        id_token: accountData.id_token,
        session_state: accountData.session_state,
      });
    }

    // For regular email/password signup, use the original function
    return originalCreateUser(data);
  };

  return typedAdapter;
}