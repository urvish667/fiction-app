import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new NextResponse('No signature found', { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[STRIPE_WEBHOOK_ERROR] Invalid signature:', err);
      return new NextResponse('Invalid signature', { status: 400 });
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update donation status in our database
        await prisma.donation.update({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { 
            status: 'succeeded',
            updatedAt: new Date(),
          },
        });

        // Create a notification for the recipient
        const donation = await prisma.donation.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
          include: { donor: true },
        });

        if (donation) {
          await prisma.notification.create({
            data: {
              userId: donation.recipientId,
              type: 'donation',
              title: 'New Donation Received!',
              message: `${donation.donor.name || 'Someone'} has donated $${(donation.amount / 100).toFixed(2)} to support your work.`,
            },
          });

          // Increment recipient's unread notifications
          await prisma.user.update({
            where: { id: donation.recipientId },
            data: { unreadNotifications: { increment: 1 } },
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update donation status in our database
        await prisma.donation.update({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { 
            status: 'failed',
            updatedAt: new Date(),
          },
        });
        break;
      }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });

  } catch (error) {
    console.error('[STRIPE_WEBHOOK_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 