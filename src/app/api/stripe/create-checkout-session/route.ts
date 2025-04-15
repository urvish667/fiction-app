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
      select: { 
        donationLink: true, 
        donationMethod: true, 
        donationsEnabled: true, 
        name: true,
        country: true // Add country to the select
      },
    });

    if (!author || !author.donationsEnabled || author.donationMethod !== 'stripe') {
      return NextResponse.json({ 
        error: 'Author not found or donations not enabled via Stripe',
        message: 'Author not found or donations not enabled via Stripe'
      }, { status: 404 });
    }

    const stripeAccountId = author.donationLink;
    if (!stripeAccountId) {
      return NextResponse.json({ 
        error: 'Stripe account not linked for this author',
        message: 'Stripe account not linked for this author'
      }, { status: 400 });
    }

    // Check if the account is Indian
    if (author.country === 'IN') {
      return NextResponse.json({ 
        error: 'Stripe payments are not supported for Indian accounts',
        message: 'Stripe payments are not supported for Indian accounts. Please use PayPal instead.',
        fallbackToPayPal: true
      }, { status: 400 });
    }

    // Get the origin and ensure it's a valid URL
    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    
    // Construct valid URLs
    const successUrl = new URL(`/user/${encodeURIComponent(author.name || 'author')}`, baseUrl);
    successUrl.searchParams.set('donation_success', 'true');
    
    const cancelUrl = new URL(`/user/${encodeURIComponent(author.name || 'author')}`, baseUrl);
    cancelUrl.searchParams.set('donation_canceled', 'true');

    try {
      // Create a Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Donation to ${author.name || 'Author'}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl.toString(),
        cancel_url: cancelUrl.toString(),
        payment_intent_data: {
          transfer_data: {
            destination: stripeAccountId,
          },
        },
        metadata: {
          author_id: authorId,
          donation_type: 'direct',
        },
      });

      if (!session.url) {
        console.error('[STRIPE_CHECKOUT_ERROR] No session URL returned');
        return NextResponse.json({ 
          error: 'Could not create Stripe Checkout session.',
          message: 'Could not create Stripe Checkout session.'
        }, { status: 500 });
      }

      // Return the session URL to redirect the user
      return NextResponse.json({ url: session.url });

    } catch (error: any) {
      console.error('[STRIPE_CHECKOUT_ERROR]', error);
      
      // Handle specific error cases
      if (error.code === 'charge_invalid_parameter' && error.message?.includes('IN')) {
        return NextResponse.json({ 
          error: 'Stripe payments are not supported for Indian accounts. Please use PayPal instead.',
          message: 'Stripe payments are not supported for Indian accounts. Please use PayPal instead.'
        }, { status: 400 });
      }
      
      // Return a more specific error message
      return NextResponse.json({ 
        error: error.message || 'Internal Server Error',
        message: error.message || 'Internal Server Error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 