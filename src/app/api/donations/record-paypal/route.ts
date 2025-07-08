import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createDonationNotification } from '@/lib/notification-helpers';

// Schema for the request body
const recordPaypalSchema = z.object({
  recipientId: z.string().min(1, { message: 'Recipient ID is required' }),
  amount: z.number().positive({ message: 'Amount must be positive' }).int({ message: 'Amount must be an integer (in cents)' }),
  message: z.string().optional(),
  storyId: z.string().optional(),
  paypalOrderId: z.string().min(1, { message: 'PayPal order ID is required' }),
  paypalTransactionId: z.string().optional(),
});

/**
 * API endpoint for recording a successful PayPal payment
 */
export async function POST(req: Request) {
  try {
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
    const validation = recordPaypalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation Error',
        message: 'Invalid payment data',
        errors: validation.error.errors
      }, { status: 400 });
    }

    // 3. Extract validated data
    const { recipientId, paypalOrderId } = validation.data;

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

    // 5. Find the donation by PayPal Order ID and update it.
    // This prevents creating duplicate records.
    const donation = await prisma.donation.findFirst({
      where: {
        paypalOrderId: paypalOrderId,
        // Security check: ensure the donor is the one who initiated it
        donorId: session.user.id,
      },
    });

    if (!donation) {
      logger.error('PayPal record: No matching pending donation found for order ID.', {
        paypalOrderId,
        donorId: session.user.id,
      });
      // We don't create a new record here because the initial record
      // should have been created by the PaymentService. If it's missing,
      // something went wrong earlier in the process.
      return NextResponse.json({
        error: 'Not Found',
        message: 'No matching pending donation found. The transaction may have already been processed or failed to initiate.'
      }, { status: 404 });
    }

    // 6. Update the donation status to 'succeeded'
    const updatedDonation = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: 'succeeded',
        updatedAt: new Date(),
      },
      include: {
        donor: { select: { id: true, username: true, name: true } },
        recipient: { select: { id: true, username: true, name: true } },
        story: { select: { id: true, title: true, slug: true } },
      },
    });

    // 7. Create notification for the donation
    try {
      // Check if a notification already exists to prevent duplicates
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: updatedDonation.recipientId,
          type: 'donation',
          content: { path: ['donationId'], equals: updatedDonation.id },
        },
      });

      if (!existingNotification) {
        const actorUsername = updatedDonation.donor.username || updatedDonation.donor.name;
        await createDonationNotification({
          recipientId: updatedDonation.recipientId,
          actorId: updatedDonation.donorId,
          actorUsername: actorUsername || 'Anonymous',
          donationId: updatedDonation.id,
          amount: updatedDonation.amount,
          message: updatedDonation.message || undefined,
          storyId: updatedDonation.storyId || undefined,
          storyTitle: updatedDonation.story?.title,
          storySlug: updatedDonation.story?.slug,
        });
        logger.info('PayPal donation notification created', { donationId: updatedDonation.id });
      }
    } catch (notificationError) {
      logger.error('Failed to create notification for PayPal donation', {
        error: notificationError instanceof Error ? notificationError.message : String(notificationError),
        donationId: updatedDonation.id,
      });
    }

    // 8. Return success response
    return NextResponse.json({
      success: true,
      donationId: updatedDonation.id,
      message: 'Payment recorded successfully',
    });

  } catch (error) {
    logger.error('Error recording PayPal payment:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while recording your payment'
    }, { status: 500 });
  }
}
