import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';

/**
 * Generate a secure random state for CSRF protection in OAuth flows
 */
export async function GET() {
  try {
    // Ensure user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a secure random state
    const state = randomBytes(32).toString('hex');

    return NextResponse.json({ state });
  } catch (error) {
    logger.error('Error generating CSRF state:', error);
    return NextResponse.json(
      { error: 'Failed to generate secure state' },
      { status: 500 }
    );
  }
}
