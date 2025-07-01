import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';
import { PayoutProvider } from '@prisma/client';

// Get the Stripe client from the singleton
const stripe = getStripeClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    logger.error('[STRIPE_CALLBACK_ERROR] No session found');
    return NextResponse.redirect(new URL('/settings?tab=monetization&error=auth_failed', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // CSRF protection
  const cookieStore = await cookies();
  const csrfStateCookie = cookieStore.get('stripe_connect_state');

  if (!csrfStateCookie || csrfStateCookie.value !== state) {
    logger.error('[STRIPE_CALLBACK_ERROR] CSRF state validation failed');
    return NextResponse.redirect(new URL('/settings?tab=monetization&error=invalid_state', req.url));
  }

  // Note: We can't delete cookies in a server action, but they'll expire naturally
  // The cookie will be set with a short expiration time when creating the connect link

  if (!code) {
    logger.error('[STRIPE_CALLBACK_ERROR] No code received from Stripe');
    return NextResponse.redirect(new URL('/settings?tab=monetization&error=stripe_connect_failed', req.url));
  }

  try {
    // Exchange the authorization code for an access token and stripe_user_id
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code,
    });

    const stripeAccountId = response.stripe_user_id;

    if (!stripeAccountId) {
      logger.error('[STRIPE_CALLBACK_ERROR] No stripe_user_id received', response);
      throw new Error('Could not retrieve Stripe account ID.');
    }

    // Save the Stripe account ID to the user's record
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        donationsEnabled: true,
        donationMethod: PayoutProvider.STRIPE,
        donationLink: stripeAccountId, // Store the Stripe Account ID here
        updatedAt: new Date(),
      },
    });

    logger.info('[STRIPE_CALLBACK_SUCCESS] Stripe account connected for user', {
      userId: session.user.id,
      stripeAccountId: stripeAccountId
    });

    // Redirect back to the settings page with a success message
    return NextResponse.redirect(new URL('/settings?tab=monetization&success=stripe_connected', req.url));

  } catch (error) {
    logger.error('[STRIPE_CALLBACK_ERROR] Error during Stripe OAuth process:', error);
    const errorMessage = error instanceof Error ? error.message : 'stripe_connect_error';
    return NextResponse.redirect(new URL(`/settings?tab=monetization&error=${encodeURIComponent(errorMessage)}`, req.url));
  }
}