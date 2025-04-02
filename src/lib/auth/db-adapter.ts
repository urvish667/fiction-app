import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { handleOAuthUser } from "./auth-utils";

// Create a single Prisma instance that can be shared
export const prisma = new PrismaClient();

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    console.log(`${params.model}.${params.action} took ${after - before}ms`);
    return result;
  });
}

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