import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: undefined, // Let the library use the default stable version
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.error('[STRIPE_CALLBACK_ERROR] No session found');
    // Redirect to an error page or settings page with an error message
    return NextResponse.redirect(new URL('/settings?tab=monetization&error=auth_failed', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // TODO: Add state validation (CSRF protection)
  // Compare 'state' with a value stored in the user's session before redirecting
  // For simplicity, we'll skip this for now, but it's crucial for production

  if (!code) {
    console.error('[STRIPE_CALLBACK_ERROR] No code received from Stripe');
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
      console.error('[STRIPE_CALLBACK_ERROR] No stripe_user_id received', response);
      throw new Error('Could not retrieve Stripe account ID.');
    }

    // Save the Stripe account ID to the user's record
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        donationsEnabled: true,
        donationMethod: 'stripe',
        donationLink: stripeAccountId, // Store the Stripe Account ID here
        updatedAt: new Date(),
      },
    });

    console.log('[STRIPE_CALLBACK_SUCCESS] Stripe account connected:', stripeAccountId);
    // Redirect back to the settings page with a success message
    return NextResponse.redirect(new URL('/settings?tab=monetization&success=stripe_connected', req.url));

  } catch (error: any) {
    console.error('[STRIPE_CALLBACK_ERROR] Error during Stripe OAuth process:', error);
    const errorMessage = error.message || 'stripe_connect_error';
    return NextResponse.redirect(new URL(`/settings?tab=monetization&error=${encodeURIComponent(errorMessage)}`, req.url));
  }
} 