// lib/auth/auth-utils.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "./db-adapter";

/**
 * Hash a password
 */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password
 */
export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      accounts: true,
    },
  });
}

/**
 * Check if email is available
 */
export async function isEmailAvailable(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return !user;
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string, excludeUserId?: string) {
  const user = await prisma.user.findFirst({
    where: {
      username,
      NOT: excludeUserId ? { id: excludeUserId } : undefined,
    },
  });
  return !user;
}

/**
 * Create user with credentials
 */
export async function createUser(userData: {
  email: string;
  username: string;
  password: string;
  birthdate: Date;
  pronoun: string;
  termsAccepted: boolean;
  marketingOptIn: boolean;
  emailVerified?: Date | null;
}) {
  const hashedPassword = await hashPassword(userData.password);

  return prisma.user.create({
    data: {
      email: userData.email,
      username: userData.username,
      password: hashedPassword,
      birthdate: userData.birthdate,
      pronoun: userData.pronoun,
      termsAccepted: userData.termsAccepted,
      marketingOptIn: userData.marketingOptIn,
      emailVerified: userData.emailVerified,
      isProfileComplete: true,
      provider: "credentials",
    },
  });
}

/**
 * Check if user profile is complete
 */
export async function isProfileComplete(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isProfileComplete: true, username: true, birthdate: true, pronoun: true },
  });

  return !!user?.isProfileComplete && !!user?.username && !!user?.birthdate && !!user?.pronoun;
}

/**
 * Handle OAuth account linking
 */
export async function linkOAuthAccount(userId: string, account: {
  provider: string;
  type: string;
  providerAccountId: string;
  access_token?: string;
  expires_at?: number;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}) {
  return prisma.account.create({
    data: {
      userId,
      type: account.type,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      access_token: account.access_token,
      expires_at: account.expires_at,
      refresh_token: account.refresh_token,
      token_type: account.token_type,
      scope: account.scope,
      id_token: account.id_token,
      session_state: account.session_state,
    },
  });
}

/**
 * Handle OAuth user creation/login
 */
export async function handleOAuthUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
  provider: string;
  providerAccountId: string;
  access_token?: string;
  expires_at?: number;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}) {
  // First, try to find an existing user by email
  let user = await prisma.user.findUnique({
    where: { email: params.email },
    include: { accounts: true },
  });

  if (user) {
    // Check if this OAuth account is already linked
    const existingAccount = user.accounts.find(
      (acc) => acc.provider === params.provider && acc.providerAccountId === params.providerAccountId
    );

    if (!existingAccount) {
      // Link the new OAuth account to the existing user
      await linkOAuthAccount(user.id, {
        provider: params.provider,
        type: "oauth",
        providerAccountId: params.providerAccountId,
        access_token: params.access_token,
        expires_at: params.expires_at,
        refresh_token: params.refresh_token,
        token_type: params.token_type,
        scope: params.scope,
        id_token: params.id_token,
        session_state: params.session_state,
      });
    }

    // Update user information if needed
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: params.name || user.name,
        image: params.image || user.image,
        lastLogin: new Date(),
      },
    });
  } else {
    // Create new user with OAuth account
    user = await prisma.user.create({
      data: {
        email: params.email,
        name: params.name,
        image: params.image,
        provider: params.provider,
        isProfileComplete: false,
        emailVerified: new Date(),
        accounts: {
          create: {
            type: "oauth",
            provider: params.provider,
            providerAccountId: params.providerAccountId,
            access_token: params.access_token,
            expires_at: params.expires_at,
            refresh_token: params.refresh_token,
            token_type: params.token_type,
            scope: params.scope,
            id_token: params.id_token,
            session_state: params.session_state,
          },
        },
      },
      include: { accounts: true },
    });
  }

  return user;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}