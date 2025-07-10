import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { createDonationNotification } from '@/lib/notification-helpers';

// Get the Stripe client from the singleton
const stripe = getStripeClient();

// Get the webhook secret from environment variables
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Ensure webhook secret is set
if (!webhookSecret) {
  logger.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
}

// Helper function to get story title
async function getStoryTitle(storyId: string): Promise<string | undefined> {
  try {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { title: true }
    });
    return story?.title;
  } catch (error) {
    logger.error('Error fetching story title:', error);
    return undefined;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new NextResponse('No signature found', { status: 400 });
    }

    let event: Stripe.Event;

    try {
      if (!webhookSecret) {
        throw new Error('Webhook secret is not configured');
      }
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.error('[STRIPE_WEBHOOK_ERROR] Invalid signature:', err);
      return new NextResponse('Invalid signature', { status: 400 });
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Check if a donation record already exists
        let donation = await prisma.donation.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
          include: {
            donor: { select: { id: true, username: true, name: true } },
            recipient: { select: { id: true, username: true, name: true } },
            story: { select: { id: true, title: true, slug: true } },
          },
        });

        // If no donation record exists, create one
        if (!donation) {
          const { donorId, recipientId, message, storyId } = paymentIntent.metadata;

          donation = await prisma.donation.create({
            data: {
              donorId,
              recipientId,
              amountCents: paymentIntent.amount,
              message,
              storyId,
              stripePaymentIntentId: paymentIntent.id,
              status: 'collected',
            },
            include: {
              donor: { select: { id: true, username: true, name: true } },
              recipient: { select: { id: true, username: true, name: true } },
              story: { select: { id: true, title: true, slug: true } },
            },
          });
        } else {
          // If donation already exists, update its status
          donation = await prisma.donation.update({
            where: { id: donation.id },
            data: { status: 'collected', updatedAt: new Date() },
            include: {
              donor: { select: { id: true, username: true, name: true } },
              recipient: { select: { id: true, username: true, name: true } },
              story: { select: { id: true, title: true, slug: true } },
            },
          });
        }

        if (donation) {
          try {
            // Check if notification already exists (duplicate prevention)
            const existingNotification = await prisma.notification.findFirst({
              where: {
                userId: donation.recipientId,
                type: 'donation',
                content: {
                  path: ['donationId'],
                  equals: donation.id
                }
              }
            });

            if (existingNotification) {
              logger.info('Stripe webhook: Donation already has notification', {
                donationId: donation.id,
                paymentIntentId: paymentIntent.id,
                notificationId: existingNotification.id
              });
            } else {
              // Create notification as backup
              const actorUsername = donation.donor.username || donation.donor.name;
              await createDonationNotification({
                recipientId: donation.recipientId,
                actorId: donation.donorId,
                actorUsername: actorUsername || 'Anonymous',
                donationId: donation.id,
                amount: donation.amountCents,
                message: donation.message || undefined,
                storyId: donation.storyId || undefined,
                storyTitle: donation.story?.title,
                storySlug: donation.story?.slug,
              });

              logger.info('Stripe webhook: Backup notification created successfully', {
                donationId: donation.id,
                recipientId: donation.recipientId,
                donorId: donation.donorId,
                paymentIntentId: paymentIntent.id
              });
            }
          } catch (notificationError) {
            logger.error('Failed to create Stripe backup notification', {
              error: notificationError instanceof Error ? notificationError.message : String(notificationError),
              stack: notificationError instanceof Error ? notificationError.stack : undefined,
              donationId: donation.id,
              recipientId: donation.recipientId,
              donorId: donation.donorId,
              paymentIntentId: paymentIntent.id
            });
            // Don't fail the webhook if notification creation fails
            // The payment was successful, notification failure shouldn't affect that
          }
        } else {
          logger.warn('Stripe webhook: Donation not found for payment intent', {
            paymentIntentId: paymentIntent.id
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
    logger.error('[STRIPE_WEBHOOK_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
