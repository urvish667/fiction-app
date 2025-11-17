import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

interface JWTPayload {
  userId: string;
  email: string;
  username?: string;
  type: 'access' | 'refresh';
}

export interface ServerUser {
  id: string;
  email: string;
  username?: string;
}

/**
 * Extract and verify JWT token from cookies to get the authenticated user
 * This runs server-side only and allows direct database authentication for SSR
 */
export async function getServerUser(): Promise<ServerUser | null> {
  try {
    // Get the access token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('fablespace_access_token')?.value;

    if (!token) {
      return null;
    }

    // Get the JWT secret from environment variables
    const jwtSecret = process.env.JWT_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT secret not found in environment variables');
      return null;
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Check token type
    if (decoded.type !== 'access') {
      return null;
    }

    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      username: user.username || undefined,
    };
  } catch (error) {
    // Silently fail for auth issues during SSR
    console.error('Auth verification failed:', error);
    return null;
  }
}

/**
 * Optional authentication that won't fail if user is not authenticated
 */
export async function getOptionalServerUser(): Promise<ServerUser | null> {
  return getServerUser();
}
