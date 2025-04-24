/**
 * WebSocket Authentication Utilities
 *
 * This module provides utilities for WebSocket authentication.
 */

import { sign, verify } from 'jsonwebtoken';
import { logger } from '@/lib/logger';

/**
 * Generate a WebSocket authentication token
 * @param userId The user ID
 * @param name The user name (optional)
 * @returns The JWT token or null if generation fails
 */
export function generateWebSocketToken(userId: string, name?: string): string | null {
  try {
    // Get JWT encryption key
    const jwtKey = process.env.JWT_ENCRYPTION_KEY;
    if (!jwtKey) {
      logger.error('JWT_ENCRYPTION_KEY is not set');
      return null;
    }

    // Generate token with short expiration (5 minutes)
    const token = sign(
      {
        sub: userId,
        name: name || userId,
        exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes
      },
      jwtKey
    );

    return token;
  } catch (error) {
    logger.error('Error generating WebSocket token:', error);
    return null;
  }
}

/**
 * Verify a WebSocket authentication token
 * @param token The JWT token
 * @returns The user ID or null if verification fails
 */
export function verifyWebSocketToken(token: string): string | null {
  try {
    // Get JWT encryption key
    const jwtKey = process.env.JWT_ENCRYPTION_KEY;
    if (!jwtKey) {
      logger.error('JWT_ENCRYPTION_KEY is not set');
      return null;
    }

    logger.debug(`Verifying WebSocket token with key length: ${jwtKey.length}`);

    // Verify token
    const decoded = verify(token, jwtKey) as { sub: string };
    logger.debug(`WebSocket token verified successfully for user: ${decoded.sub}`);
    return decoded.sub;
  } catch (error) {
    logger.error('Error verifying WebSocket token:', error);
    // Log more details about the error
    if (error instanceof Error) {
      logger.error(`Error name: ${error.name}, message: ${error.message}`);
    }
    return null;
  }
}
