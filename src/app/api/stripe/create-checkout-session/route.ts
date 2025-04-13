import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: undefined,
});

// Schema for the request body
const checkoutSchema = z.object({
  authorId: z.string().min(1, { message: 'Author ID is required' }),
  amount: z.number().positive({ message: 'Amount must be positive' }).int({ message: 'Amount must be an integer (in cents)' }),
  // Optional: Add more fields like donor name/message if desired later
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { authorId, amount } = validation.data;

    // Fetch the author's Stripe account ID
    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: { donationLink: true, donationMethod: true, donationsEnabled: true, name: true },
    });

    if (!author || !author.donationsEnabled || author.donationMethod !== 'stripe') {
      return new NextResponse('Author not found or donations not enabled via Stripe', { status: 404 });
    }

    const stripeAccountId = author.donationLink;
    if (!stripeAccountId) {
      return new NextResponse('Stripe account not linked for this author', { status: 400 });
    }

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${origin}/user/${author.name}?donation_success=true`; // Redirect to author profile on success
    const cancelUrl = `${origin}/user/${author.name}?donation_canceled=true`; // Redirect to author profile on cancel

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', // Or your desired currency
            product_data: {
              name: `Donation to ${author.name || 'Author'}`,
              // Optional: Add description or images
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Direct the payment to the connected Stripe account
      payment_intent_data: {
        application_fee_amount: 0, // Set to 0 as we are not taking a platform fee
        transfer_data: {
          destination: stripeAccountId,
        },
      },
      // Optional: Pre-fill customer email if available
      // customer_email: donorEmail,
      // Optional: Collect billing address
      // billing_address_collection: 'required',
    });

    if (!session.url) {
      console.error('[STRIPE_CHECKOUT_ERROR] No session URL returned');
      return new NextResponse('Could not create Stripe Checkout session.', { status: 500 });
    }

    // Return the session URL to redirect the user
    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 