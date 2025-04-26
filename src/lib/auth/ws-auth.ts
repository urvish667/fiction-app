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

    logger.debug(`Generating WebSocket token with key length: ${jwtKey.length}`);

    // Generate token with short expiration (15 minutes)
    const payload = {
      sub: userId,
      name: name || userId,
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    logger.debug(`WebSocket token payload: ${JSON.stringify(payload)}`);

    // Generate token
    const token = sign(payload, jwtKey);

    logger.debug(`WebSocket token generated successfully for user: ${userId}`);
    return token;
  } catch (error) {
    logger.error('Error generating WebSocket token:', error);
    // Log more details about the error
    if (error instanceof Error) {
      logger.error(`Error name: ${error.name}, message: ${error.message}`);
    }
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

    // Log token details for debugging (only first few characters for security)
    const tokenPreview = token.substring(0, 10) + '...';
    logger.debug(`Token preview: ${tokenPreview}`);

    // Verify token
    const decoded = verify(token, jwtKey) as { sub: string };

    if (!decoded || !decoded.sub) {
      logger.error('Token verification succeeded but no sub claim found');
      return null;
    }

    logger.debug(`WebSocket token verified successfully for user: ${decoded.sub}`);
    return decoded.sub;
  } catch (error) {
    logger.error('Error verifying WebSocket token:', error);
    // Log more details about the error
    if (error instanceof Error) {
      logger.error(`Error name: ${error.name}, message: ${error.message}`);

      // For JWT errors, provide more specific information
      if (error.name === 'JsonWebTokenError') {
        logger.error('JWT validation failed - token might be malformed or using wrong key');
      } else if (error.name === 'TokenExpiredError') {
        logger.error('JWT token has expired');
      }
    }
    return null;
  }
}
