import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';
import { PaymentService } from '@/lib/payment/paymentService';
import { logger } from '@/lib/logger';

// Schema for the request body
const donationSchema = z.object({
  recipientId: z.string().min(1, { message: 'Recipient ID is required' }),
  amount: z.number().positive({ message: 'Amount must be positive' }).int({ message: 'Amount must be an integer (in cents)' }),
  message: z.string().optional(),
  storyId: z.string().optional(),
});

/**
 * API endpoint for creating donations using the unified payment gateway
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'You must be logged in to make a donation'
      }, { status: 401 });
    }

    // 2. Validate request body
    const body = await req.json();
    const validation = donationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation Error',
        message: 'Invalid donation data',
        errors: validation.error.errors
      }, { status: 400 });
    }

    // 3. Extract validated data
    const { recipientId, amount, message, storyId } = validation.data;

    // 4. Process payment using the unified payment service (singleton)
    const paymentService = PaymentService.getInstance();
    const paymentResponse = await paymentService.processPayment({
      recipientId,
      amount,
      message,
      storyId,
      donorId: session.user.id
    });

    // 5. Handle payment response
    if (!paymentResponse.success) {
      return NextResponse.json({
        error: paymentResponse.errorCode || 'Payment Error',
        message: paymentResponse.error || 'An error occurred while processing your payment',
        status: 'error'
      }, { status: 400 });
    }

    // 6. Return appropriate response based on payment processor
    if (paymentResponse.processorType === 'stripe') {
      return NextResponse.json({
        processorType: 'stripe',
        clientSecret: paymentResponse.clientSecret,
        donationId: paymentResponse.donationId,
        status: 'success'
      });
    } else if (paymentResponse.processorType === 'paypal') {
      return NextResponse.json({
        processorType: 'paypal',
        donationId: paymentResponse.donationId,
        status: 'success'
      });
    }

    // This should never happen if the payment service is implemented correctly
    return NextResponse.json({
      error: 'Invalid Payment Processor',
      message: 'The payment processor returned an invalid response',
      status: 'error'
    }, { status: 500 });

  } catch (error) {
    logger.error('Donation API error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your donation',
      status: 'error'
    }, { status: 500 });
  }
}