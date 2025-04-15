import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

// Schema for the request body
const donationSchema = z.object({
  recipientId: z.string().min(1, { message: 'Recipient ID is required' }),
  amount: z.number().positive({ message: 'Amount must be positive' }).int({ message: 'Amount must be an integer (in cents)' }),
  message: z.string().optional(),
  paymentMethod: z.enum(['stripe', 'paypal']),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to make a donation'
      }, { status: 401 });
    }

    const body = await req.json();
    const validation = donationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation Error',
        message: 'Invalid donation data',
        errors: validation.error.errors 
      }, { status: 400 });
    }

    const { recipientId, amount, message, paymentMethod } = validation.data;

    // Fetch recipient's donation settings
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { 
        donationLink: true, 
        donationMethod: true, 
        donationsEnabled: true, 
        name: true,
        email: true 
      },
    });

    if (!recipient || !recipient.donationsEnabled) {
      return NextResponse.json({ 
        error: 'Recipient Not Found',
        message: 'Recipient not found or donations not enabled'
      }, { status: 404 });
    }

    // Create a donation record in our database first
    const donation = await prisma.donation.create({
      data: {
        donorId: session.user.id,
        recipientId,
        amount,
        message: message || null,
        status: 'pending',
        paymentMethod,
      },
    });

    if (paymentMethod === 'stripe') {
      const stripeAccountId = recipient.donationLink;
      if (!stripeAccountId) {
        return NextResponse.json({ 
          error: 'Stripe Not Configured',
          message: 'Stripe account not linked for this recipient'
        }, { status: 400 });
      }

      try {
        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          application_fee_amount: 0, // No platform fee
          transfer_data: {
            destination: stripeAccountId,
          },
          metadata: {
            donationId: donation.id,
            donorId: session.user.id,
            recipientId,
            message: message || '',
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        // Update donation record with Stripe payment intent ID
        await prisma.donation.update({
          where: { id: donation.id },
          data: { stripePaymentIntentId: paymentIntent.id },
        });

        return NextResponse.json({ 
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          status: 'success'
        });
      } catch (error: any) {
        console.error('[STRIPE_PAYMENT_INTENT_ERROR]', error);
        
        // Handle specific error cases
        if (error.code === 'charge_invalid_parameter' && error.message?.includes('IN')) {
          // If Stripe fails for Indian accounts, suggest PayPal
          if (recipient.donationMethod === 'paypal' && recipient.donationLink) {
            return NextResponse.json({ 
              error: 'Stripe Not Supported',
              message: 'Stripe payments are not supported for Indian accounts. Please use PayPal instead.',
              fallbackToPayPal: true,
              paypalLink: recipient.donationLink,
            }, { status: 400 });
          }
        }
        
        // Update donation status to failed
        await prisma.donation.update({
          where: { id: donation.id },
          data: { status: 'failed' },
        });
        
        throw error;
      }
    } else if (paymentMethod === 'paypal') {
      if (!recipient.donationLink) {
        return NextResponse.json({ 
          error: 'PayPal Not Configured',
          message: 'PayPal link not configured for this recipient'
        }, { status: 400 });
      }

      // Return success response for PayPal
      return NextResponse.json({ 
        donationId: donation.id,
        paypalLink: recipient.donationLink,
        status: 'success'
      });
    }

    return NextResponse.json({ 
      error: 'Invalid Payment Method',
      message: 'Invalid payment method selected'
    }, { status: 400 });

  } catch (error) {
    console.error('[DONATION_ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your donation'
    }, { status: 500 });
  }
} 