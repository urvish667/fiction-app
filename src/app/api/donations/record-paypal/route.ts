import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

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
    const { recipientId, amount, message, storyId, paypalOrderId } = validation.data;

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
        paypalOrderId: paypalOrderId,
      },
    });

    if (existingDonation) {
      // Update the existing donation record
      await prisma.donation.update({
        where: { id: existingDonation.id },
        data: {
          status: 'succeeded',
          updatedAt: new Date(),
        },
      });

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
        amount,
        message: message || null,
        storyId: storyId || null,
        status: 'succeeded',
        paymentMethod: 'paypal',
        paypalOrderId,
      },
    });

    // 7. Return success response
    return NextResponse.json({
      success: true,
      donationId: donation.id,
      message: 'Payment recorded successfully'
    });

  } catch (error) {
    logger.error('Error recording PayPal payment:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while recording your payment'
    }, { status: 500 });
  }
}
