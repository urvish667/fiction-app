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
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate WebSocket token
    const token = generateWebSocketToken(session.user.id, session.user.name || undefined);
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to generate token' },
        { status: 500 }
      );
    }

    // Return token
    return NextResponse.json({ token });
  } catch (error) {
    logger.error('Error generating WebSocket token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
