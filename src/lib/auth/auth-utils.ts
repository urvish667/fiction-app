import bcrypt from "bcryptjs";
import { prisma } from "./db-adapter";

/**
 * Hash a password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });
  return !existingUser;
}

/**
 * Check if an email is available
 */
export async function isEmailAvailable(email: string): Promise<boolean> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  return !existingUser;
}

/**
 * Create a new user account
 */
export async function createUser(userData: {
  email: string;
  username: string;
  password: string;
  birthdate: Date;
  pronoun: string;
  termsAccepted: boolean;
  marketingOptIn: boolean;
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
    },
  });
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
} 