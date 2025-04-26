/**
 * API endpoint to generate a WebSocket authentication token
 *
 * This endpoint generates a JWT token for WebSocket authentication.
 * It uses the same JWT_ENCRYPTION_KEY as the main authentication system.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateWebSocketToken } from '@/lib/auth/ws-auth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    logger.debug('WebSocket token request received, session:', session ? 'exists' : 'null');

    if (!session?.user?.id) {
      logger.warn('WebSocket token request unauthorized - no user ID in session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Log user info for debugging
    logger.debug(`Generating WebSocket token for user: ${session.user.id}`);

    // Generate WebSocket token
    const token = generateWebSocketToken(session.user.id, session.user.name || undefined);
    if (!token) {
      logger.error('Failed to generate WebSocket token - generateWebSocketToken returned null');
      return NextResponse.json(
        { error: 'Failed to generate token' },
        { status: 500 }
      );
    }

    // Log success
    logger.debug(`WebSocket token generated successfully for user: ${session.user.id}`);

    // Return token
    return NextResponse.json({ token });
  } catch (error) {
    logger.error('Error generating WebSocket token:', error);
    // Log more details about the error
    if (error instanceof Error) {
      logger.error(`Error name: ${error.name}, message: ${error.message}`);
    }
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
