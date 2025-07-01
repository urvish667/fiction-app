import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/auth/db-adapter';
import { logger } from '@/lib/logger';

/**
 * API endpoint to get a user's preferred payment method
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'You must be logged in to access this endpoint'
      }, { status: 401 });
    }

    // 2. Get the user ID from the query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        error: 'Missing Parameter',
        message: 'User ID is required'
      }, { status: 400 });
    }

    // 3. Fetch the user's payment settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        donationMethod: true,
        donationsEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        error: 'User Not Found',
        message: 'User not found'
      }, { status: 404 });
    }

    if (!user.donationsEnabled) {
      return NextResponse.json({
        error: 'Donations Disabled',
        message: 'This user has not enabled donations'
      }, { status: 400 });
    }

    // 4. Return the user's payment method
    return NextResponse.json({
      paymentMethod: user.donationMethod || 'STRIPE', // Default to Stripe if not set
      donationsEnabled: user.donationsEnabled,
    });

  } catch (error) {
    logger.error('Error getting user payment method:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
