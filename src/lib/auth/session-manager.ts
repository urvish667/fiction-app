/**
 * Session Manager
 *
 * This module provides session management for the FableSpace application.
 * It includes utilities for tracking sessions, invalidating sessions,
 * and handling concurrent sessions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createHmac, randomBytes } from 'crypto';
import { Redis } from 'ioredis';
import { generateFingerprint } from './jwt-utils';
import { ErrorCode, createErrorResponse } from '../error-handling';
import { logError, logWarning } from '../error-logger';

// Session status
export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  INVALID = 'invalid',
}

// Session information
export interface SessionInfo {
  id: string;
  userId: string;
  fingerprint: string;
  userAgent: string;
  ip: string;
  createdAt: number;
  expiresAt: number;
  lastActivityAt: number;
  status: SessionStatus;
}

// Import the global Redis client
import { getRedisClient } from '../redis';

/**
 * Initialize the Redis client for session storage
 * Uses the global Redis client singleton to prevent connection cycling
 */
export function initSessionStorage(): Redis | null {
  // Check if Redis is enabled for sessions
  if (process.env.SESSION_REDIS_ENABLED !== 'true') {
    return null;
  }

  // Use the global Redis client instead of creating a new one
  return getRedisClient();
}

/**
 * Generate a session ID
 * @returns A unique session ID
 */
export function generateSessionId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Create a session for a user
 * @param userId The user ID
 * @param req The Next.js request object
 * @param expiresIn Session expiration time in seconds (default: 14 days)
 * @returns The session information
 */
export async function createSession(
  userId: string,
  req: NextRequest,
  expiresIn: number = 14 * 24 * 60 * 60 // 14 days
): Promise<SessionInfo> {
  // Generate session ID
  const sessionId = generateSessionId();

  // Get client information
  const fingerprint = generateFingerprint(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  // Create session information
  const now = Date.now();
  const session: SessionInfo = {
    id: sessionId,
    userId,
    fingerprint,
    userAgent,
    ip,
    createdAt: now,
    expiresAt: now + expiresIn * 1000,
    lastActivityAt: now,
    status: SessionStatus.ACTIVE,
  };

  // Store session in Redis if available
  const redis = initSessionStorage();
  if (redis) {
    try {
      // Store session information
      await redis.set(
        `session:${sessionId}`,
        JSON.stringify(session),
        'EX',
        expiresIn
      );

      // Add session to user's sessions
      await redis.sadd(`user:${userId}:sessions`, sessionId);

      // Set expiration for user's sessions set
      await redis.expire(`user:${userId}:sessions`, expiresIn);
    } catch (error) {
      logError('Failed to store session in Redis', { error, userId, sessionId });
    }
  }

  return session;
}

/**
 * Get session information
 * @param sessionId The session ID
 * @returns The session information or null if not found
 */
export async function getSession(sessionId: string): Promise<SessionInfo | null> {
  // Get session from Redis if available
  const redis = initSessionStorage();
  if (redis) {
    try {
      const sessionData = await redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return null;
      }

      return JSON.parse(sessionData) as SessionInfo;
    } catch (error) {
      logError('Failed to get session from Redis', { error, sessionId });
    }
  }

  return null;
}

/**
 * Update session activity
 * @param sessionId The session ID
 * @returns Whether the update was successful
 */
export async function updateSessionActivity(sessionId: string): Promise<boolean> {
  // Get session from Redis if available
  const redis = initSessionStorage();
  if (redis) {
    try {
      // Get current session
      const sessionData = await redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return false;
      }

      // Parse session data
      const session = JSON.parse(sessionData) as SessionInfo;

      // Update last activity time
      session.lastActivityAt = Date.now();

      // Store updated session
      await redis.set(
        `session:${sessionId}`,
        JSON.stringify(session),
        'EX',
        Math.ceil((session.expiresAt - Date.now()) / 1000)
      );

      return true;
    } catch (error) {
      logError('Failed to update session activity', { error, sessionId });
    }
  }

  return false;
}

/**
 * Revoke a session
 * @param sessionId The session ID
 * @returns Whether the revocation was successful
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  // Get session from Redis if available
  const redis = initSessionStorage();
  if (redis) {
    try {
      // Get current session
      const sessionData = await redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return false;
      }

      // Parse session data
      const session = JSON.parse(sessionData) as SessionInfo;

      // Update session status
      session.status = SessionStatus.REVOKED;

      // Store updated session
      await redis.set(
        `session:${sessionId}`,
        JSON.stringify(session),
        'EX',
        Math.ceil((session.expiresAt - Date.now()) / 1000)
      );

      // Remove session from user's sessions
      await redis.srem(`user:${session.userId}:sessions`, sessionId);

      return true;
    } catch (error) {
      logError('Failed to revoke session', { error, sessionId });
    }
  }

  return false;
}

/**
 * Revoke all sessions for a user
 * @param userId The user ID
 * @param exceptSessionId Session ID to exclude from revocation
 * @returns The number of revoked sessions
 */
export async function revokeAllSessions(
  userId: string,
  exceptSessionId?: string
): Promise<number> {
  // Get sessions from Redis if available
  const redis = initSessionStorage();
  if (redis) {
    try {
      // Get all session IDs for the user
      const sessionIds = await redis.smembers(`user:${userId}:sessions`);

      // Filter out the excepted session ID
      const sessionsToRevoke = exceptSessionId
        ? sessionIds.filter(id => id !== exceptSessionId)
        : sessionIds;

      // Revoke each session
      let revokedCount = 0;
      for (const sessionId of sessionsToRevoke) {
        if (await revokeSession(sessionId)) {
          revokedCount++;
        }
      }

      return revokedCount;
    } catch (error) {
      logError('Failed to revoke all sessions', { error, userId });
    }
  }

  return 0;
}

/**
 * Get all sessions for a user
 * @param userId The user ID
 * @returns Array of session information
 */
export async function getUserSessions(userId: string): Promise<SessionInfo[]> {
  // Get sessions from Redis if available
  const redis = initSessionStorage();
  if (redis) {
    try {
      // Get all session IDs for the user
      const sessionIds = await redis.smembers(`user:${userId}:sessions`);

      // Get session information for each ID
      const sessions: SessionInfo[] = [];
      for (const sessionId of sessionIds) {
        const sessionData = await redis.get(`session:${sessionId}`);
        if (sessionData) {
          sessions.push(JSON.parse(sessionData) as SessionInfo);
        }
      }

      return sessions;
    } catch (error) {
      logError('Failed to get user sessions', { error, userId });
    }
  }

  return [];
}

/**
 * Verify session validity
 * @param req The Next.js request object
 * @returns The session information if valid, null otherwise
 */
export async function verifySession(req: NextRequest): Promise<SessionInfo | null> {
  try {
    // Get the token from the request
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    // If no token, return null
    if (!token) {
      return null;
    }

    // Get session ID from token
    const sessionId = token.sessionId as string;
    if (!sessionId) {
      return null;
    }

    // Get session information
    const session = await getSession(sessionId);
    if (!session) {
      return null;
    }

    // Check session status
    if (session.status !== SessionStatus.ACTIVE) {
      logWarning('Session is not active', {
        sessionId,
        status: session.status,
        userId: session.userId,
      });
      return null;
    }

    // Check session expiration
    if (Date.now() >= session.expiresAt) {
      logWarning('Session has expired', {
        sessionId,
        userId: session.userId,
        expiresAt: new Date(session.expiresAt).toISOString(),
      });
      return null;
    }

    // Verify fingerprint
    const currentFingerprint = generateFingerprint(req);
    if (session.fingerprint !== currentFingerprint) {
      logWarning('Session fingerprint mismatch', {
        sessionId,
        userId: session.userId,
        expectedFingerprint: session.fingerprint,
        actualFingerprint: currentFingerprint,
      });
      return null;
    }

    // Update session activity
    await updateSessionActivity(sessionId);

    return session;
  } catch (error) {
    logError('Session verification error', { error });
    return null;
  }
}

/**
 * Middleware to verify session
 * @param req The Next.js request object
 * @returns NextResponse if verification fails, null otherwise
 */
export async function verifySessionMiddleware(req: NextRequest): Promise<NextResponse | null> {
  // Verify the session
  const session = await verifySession(req);

  // If no session or invalid session, return 401 Unauthorized
  if (!session) {
    return createErrorResponse(
      ErrorCode.UNAUTHORIZED,
      'Authentication required'
    );
  }

  return null;
}

/**
 * Middleware to protect API routes with session verification
 * @param handler The API route handler
 */
export function withSession(
  handler: (req: NextRequest, session: SessionInfo) => Promise<NextResponse> | NextResponse
) {
  return async function sessionHandler(req: NextRequest) {
    // Verify the session
    const session = await verifySession(req);

    // If no session or invalid session, return 401 Unauthorized
    if (!session) {
      return createErrorResponse(
        ErrorCode.UNAUTHORIZED,
        'Authentication required'
      );
    }

    // Call the original handler with the session
    return handler(req, session);
  };
}

/**
 * Middleware to limit the number of concurrent sessions per user
 * @param maxSessions Maximum number of concurrent sessions allowed
 */
export function limitConcurrentSessions(maxSessions: number = 5) {
  return async function concurrentSessionsMiddleware(req: NextRequest) {
    // Get the token from the request
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    // If no token, continue (will be handled by authentication middleware)
    if (!token) {
      return null;
    }

    // Get user ID from token
    const userId = token.sub as string;
    if (!userId) {
      return null;
    }

    // Get session ID from token
    const sessionId = token.sessionId as string;
    if (!sessionId) {
      return null;
    }

    // Get all sessions for the user
    const sessions = await getUserSessions(userId);

    // If the number of sessions exceeds the limit, revoke the oldest sessions
    if (sessions.length > maxSessions) {
      // Sort sessions by creation time (oldest first)
      const sortedSessions = [...sessions].sort((a, b) => a.createdAt - b.createdAt);

      // Keep the current session and the newest sessions up to the limit
      const sessionsToKeep = new Set([
        sessionId,
        ...sortedSessions
          .slice(-(maxSessions - 1))
          .map(s => s.id)
      ]);

      // Revoke sessions that are not in the keep list
      for (const session of sortedSessions) {
        if (!sessionsToKeep.has(session.id)) {
          await revokeSession(session.id);
        }
      }

      // Log the session limit enforcement
      logWarning('Enforced session limit for user', {
        userId,
        currentSessionId: sessionId,
        totalSessions: sessions.length,
        maxSessions,
        revokedSessions: sessions.length - maxSessions,
      });
    }

    return null;
  };
}
