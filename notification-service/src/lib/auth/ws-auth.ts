/**
 * WebSocket authentication utilities
 *
 * This module provides functions for authenticating WebSocket connections
 * using JWT tokens.
 */

import jwt from 'jsonwebtoken';
import { logger } from '../logger';

/**
 * Verify a WebSocket token
 * @param token The JWT token to verify
 * @returns The user ID if the token is valid, null otherwise
 */
export function verifyWebSocketToken(token: string): string | null {
  // Get JWT encryption key from environment variables
  const JWT_ENCRYPTION_KEY = process.env.JWT_ENCRYPTION_KEY;

  if (!JWT_ENCRYPTION_KEY) {
    logger.error('JWT_ENCRYPTION_KEY is not configured');
    // Log additional information for debugging
    logger.error(`Environment variables available: ${Object.keys(process.env).join(', ')}`);
    return null;
  }

  try {
    // Verify the token with explicit options
    const decoded = jwt.verify(token, JWT_ENCRYPTION_KEY, {
      algorithms: ['HS256'], // Explicitly specify algorithm
      ignoreExpiration: false, // Ensure expiration is checked
    }) as { sub: string; exp?: number };

    // Additional validation
    if (!decoded.sub) {
      logger.warn('Token missing subject (user ID)');
      return null;
    }

    // Check if token is about to expire (within 5 minutes)
    if (decoded.exp && decoded.exp * 1000 - Date.now() < 5 * 60 * 1000) {
      logger.warn(`Token for user ${decoded.sub} is about to expire`);
      // Still return the user ID, but log the warning
    }

    // Return the user ID
    return decoded.sub;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token');
    } else {
      logger.error('Failed to verify WebSocket token:', error);
    }
    return null;
  }
}

export default {
  verifyWebSocketToken,
};
