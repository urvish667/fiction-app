import { prisma } from '@/lib/prisma';
import { PaymentMethod, PaymentRequest, PaymentResponse, PaymentRecipient } from './types';
import { StripePaymentProcessor } from './processors/stripeProcessor';
import { PayPalPaymentProcessor } from './processors/paypalProcessor';
import { logger } from '@/lib/logger';

/**
 * Unified Payment Service that orchestrates payment processing.
 * Implemented as a singleton.
 */
export class PaymentService {
  private static instance: PaymentService;
  private stripeProcessor: StripePaymentProcessor;
  private paypalProcessor: PayPalPaymentProcessor;

  private constructor() {
    this.stripeProcessor = new StripePaymentProcessor();
    this.paypalProcessor = new PayPalPaymentProcessor();
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 1. Validate request and recipient
      if (!request.recipientId || !request.donorId || request.amount <= 0) {
        return this.createErrorResponse('Invalid payment request');
      }
      const recipient = await this.getRecipient(request.recipientId);
      if (!recipient || !recipient.donationsEnabled) {
        return this.createErrorResponse('Recipient not found or donations not enabled', 'RECIPIENT_NOT_FOUND');
      }

      // 2. Select and run the payment processor
      const processor = recipient.donationMethod === 'STRIPE' ? this.stripeProcessor : this.paypalProcessor;
      if (!processor.validatePaymentSetup(recipient)) {
        return this.createErrorResponse(`${recipient.donationMethod} not configured`, `${recipient.donationMethod}_NOT_CONFIGURED`);
      }
      const paymentResponse = await processor.processPayment(request, recipient);

      // For PayPal, ensure paypalOrderId is present before creating donation record
      if (recipient.donationMethod === 'PAYPAL') {
        if (!paymentResponse.success) {
          return paymentResponse;
        }
        if (!paymentResponse.paypalOrderId) {
          return {
            success: false,
            processorType: 'PAYPAL',
            error: paymentResponse.error || 'PayPal order ID missing from payment processor.',
            errorCode: paymentResponse.errorCode || 'PAYPAL_ORDER_ID_MISSING',
          };
        }
      } else {
        if (!paymentResponse.success) {
          return paymentResponse;
        }
      }

      // 3. Create the donation record with the PayPal Order ID if available
      const donation = await this.createDonationRecord(
        request,
        recipient.donationMethod,
        paymentResponse.paypalOrderId
      );
      
      // 4. Update the donation record with other details (e.g., Stripe Payment Intent)
      await this.updateDonationRecord(donation.id, paymentResponse);

      // 5. Return the final response with our internal donation ID
      return {
        ...paymentResponse,
        donationId: donation.id,
      };

    } catch (error) {
      logger.error('Payment processing error:', { error });
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        'PAYMENT_PROCESSING_ERROR'
      );
    }
  }

  private async getRecipient(recipientId: string): Promise<PaymentRecipient | null> {
    return prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        name: true,
        email: true,
        donationMethod: true,
        donationLink: true,
        donationsEnabled: true,
      },
    });
  }

  private async createDonationRecord(
    request: PaymentRequest,
    paymentMethod: PaymentMethod | null,
    paypalOrderId?: string
  ) {
    return prisma.donation.create({
      data: {
        donorId: request.donorId,
        recipientId: request.recipientId,
        amount: request.amount,
        message: request.message || null,
        storyId: request.storyId || null,
        status: 'pending',
        paymentMethod: paymentMethod || undefined,
        paypalOrderId: paypalOrderId || null, // Store the PayPal Order ID
      },
    });
  }

  private async updateDonationRecord(donationId: string, response: PaymentResponse) {
    const updateData: { [key: string]: any } = {
      updatedAt: new Date(),
    };

    if (response.processorType === 'STRIPE' && response.clientSecret) {
      updateData.stripePaymentIntentId = response.clientSecret.split('_secret')[0];
    }

    if (!response.success) {
      updateData.status = 'failed';
    }

    await prisma.donation.update({
      where: { id: donationId },
      data: updateData,
    });
  }

  private createErrorResponse(message: string, code?: string): PaymentResponse {
    return {
      success: false,
      processorType: 'STRIPE', // Default, not critical for error responses
      error: message,
      errorCode: code,
    };
  }
}
