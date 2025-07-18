import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createDonationNotification } from '@/lib/notification-helpers';

// Schema for the request body
const recordStripeSchema = z.object({
  recipientId: z.string().min(1, { message: 'Recipient ID is required' }),
  amount: z.number().positive({ message: 'Amount must be positive' }).int({ message: 'Amount must be an integer (in cents)' }),
  message: z.string().optional(),
  storyId: z.string().optional(),
  stripePaymentIntentId: z.string().min(1, { message: 'Stripe payment intent ID is required' }),
});

/**
 * API endpoint for recording a successful Stripe payment
 * This provides primary notification creation for Stripe donations,
 * matching the robustness of the PayPal flow
 */
export async function POST(req: Request) {
  try {
    // 0. Donationation Disabled
    // { DONATION DISABLED COMMENT }
    if (!process.env.ENABLE_DONATION) {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'Donations are disabled'
      }, { status: 403 })
    }

    // 1. Authenticate user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'You must be logged in to record a payment'
      }, { status: 401 });
    }

    // 2. Validate request body
    const body = await req.json();
    const validation = recordStripeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation Error',
        message: 'Invalid payment data',
        errors: validation.error.errors
      }, { status: 400 });
    }

    // 3. Extract validated data
    const { recipientId, amount, message, storyId, stripePaymentIntentId } = validation.data;

    // 4. Fetch recipient's donation settings
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        donationMethod: true,
        donationsEnabled: true,
      },
    });

    if (!recipient || !recipient.donationsEnabled) {
      return NextResponse.json({
        error: 'Recipient Not Found',
        message: 'Recipient not found or donations not enabled'
      }, { status: 404 });
    }

    // 5. Check if this payment has already been recorded
    const existingDonation = await prisma.donation.findFirst({
      where: {
        stripePaymentIntentId: stripePaymentIntentId,
      },
    });

    if (existingDonation) {
      // Update the existing donation record
      const updatedDonation = await prisma.donation.update({
        where: { id: existingDonation.id },
        data: {
          status: 'collected',
          updatedAt: new Date(),
        },
        include: {
          donor: {
            select: { id: true, username: true, name: true }
          },
          recipient: {
            select: { id: true, username: true, name: true }
          },
          story: {
            select: { id: true, title: true, slug: true }
          }
        }
      });

      // Create notification for updated donation if it doesn't exist
      try {
        // Check if notification already exists
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: updatedDonation.recipientId,
            type: 'donation',
            content: {
              path: ['donationId'],
              equals: updatedDonation.id
            }
          }
        });

        if (!existingNotification) {
          const actorUsername = updatedDonation.donor.username || updatedDonation.donor.name;
          await createDonationNotification({
            recipientId: updatedDonation.recipientId,
            actorId: updatedDonation.donorId,
            actorUsername: actorUsername || 'Anonymous',
            donationId: updatedDonation.id,
            amount: updatedDonation.amountCents,
            message: updatedDonation.message || undefined,
            storyId: updatedDonation.storyId || undefined,
            storyTitle: updatedDonation.story?.title,
            storySlug: updatedDonation.story?.slug,
          });

          logger.info('Stripe donation notification created for updated donation', {
            donationId: updatedDonation.id,
            recipientId: updatedDonation.recipientId,
            donorId: updatedDonation.donorId,
            paymentIntentId: stripePaymentIntentId
          });
        }
      } catch (notificationError) {
        logger.error('Failed to create notification for updated Stripe donation', {
          error: notificationError instanceof Error ? notificationError.message : String(notificationError),
          donationId: updatedDonation.id,
          paymentIntentId: stripePaymentIntentId
        });
        // Don't fail the request if notification creation fails
      }

      return NextResponse.json({
        success: true,
        donationId: existingDonation.id,
        message: 'Payment record updated successfully'
      });
    }

    // 6. Create a new donation record
    const donation = await prisma.donation.create({
      data: {
        donorId: session.user.id,
        recipientId,
        // amountCents?,
        message: message || null,
        storyId: storyId || null,
        status: 'collected',
        paymentMethod: 'STRIPE',
        stripePaymentIntentId,
      },
      include: {
        donor: {
          select: { id: true, username: true, name: true }
        },
        recipient: {
          select: { id: true, username: true, name: true }
        },
        story: {
          select: { id: true, title: true, slug: true }
        }
      }
    });

    // 7. Create notification for the new donation
    try {
      // const actorUsername = donation.donor.username || donation.donor.name;
      // await createDonationNotification({
      //   recipientId: donation.recipientId,
      //   actorId: donation.donorId,
      //   actorUsername: actorUsername || 'Anonymous',
      //   donationId: donation.id,
      //   amount: donation.amountCents,
      //   message: donation.message || undefined,
      //   storyId: donation.storyId || undefined,
      //   storyTitle: donation.story?.title,
      //   storySlug: donation.story?.slug,
      // });

      logger.info('Stripe donation notification created for new donation', {
        donationId: donation.id,
        recipientId: donation.recipientId,
        donorId: donation.donorId,
        amount: donation.amountCents,
        paymentIntentId: stripePaymentIntentId
      });
    } catch (notificationError) {
      logger.error('Failed to create notification for new Stripe donation', {
        error: notificationError instanceof Error ? notificationError.message : String(notificationError),
        donationId: donation.id,
        recipientId: donation.recipientId,
        donorId: donation.donorId,
        paymentIntentId: stripePaymentIntentId
      });
      // Don't fail the request if notification creation fails
    }

    // 8. Return success response
    return NextResponse.json({
      success: true,
      donationId: donation.id,
      message: 'Payment recorded successfully'
    });

  } catch (error) {
    logger.error('Error recording Stripe payment:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while recording your payment'
    }, { status: 500 });
  }
}
