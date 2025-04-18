import { prisma } from '@/lib/prisma';
import { PaymentMethod, PaymentRequest, PaymentResponse, PaymentRecipient } from './types';
import { StripePaymentProcessor } from './processors/stripeProcessor';
import { PayPalPaymentProcessor } from './processors/paypalProcessor';
import { logger } from '@/lib/logger';

/**
 * Unified Payment Service that orchestrates payment processing
 * regardless of the underlying payment processor
 */
export class PaymentService {
  private stripeProcessor: StripePaymentProcessor;
  private paypalProcessor: PayPalPaymentProcessor;

  constructor() {
    this.stripeProcessor = new StripePaymentProcessor();
    this.paypalProcessor = new PayPalPaymentProcessor();
  }

  /**
   * Process a payment using the appropriate payment processor
   * based on the recipient's preferences
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 1. Validate the request
      if (!request.recipientId || !request.donorId || request.amount <= 0) {
        return this.createErrorResponse('Invalid payment request');
      }

      // 2. Get recipient details
      const recipient = await this.getRecipient(request.recipientId);
      if (!recipient || !recipient.donationsEnabled) {
        return this.createErrorResponse('Recipient not found or donations not enabled', 'RECIPIENT_NOT_FOUND');
      }

      // 3. Create donation record
      const donation = await this.createDonationRecord(request, recipient.donationMethod);

      // 4. Process payment based on recipient's preferred method
      let paymentResponse: PaymentResponse;

      if (recipient.donationMethod === 'stripe') {
        if (!this.stripeProcessor.validatePaymentSetup(recipient)) {
          return this.createErrorResponse('Stripe not properly configured for this recipient', 'STRIPE_NOT_CONFIGURED');
        }
        paymentResponse = await this.stripeProcessor.processPayment(request, recipient);
      } else if (recipient.donationMethod === 'paypal') {
        if (!this.paypalProcessor.validatePaymentSetup(recipient)) {
          return this.createErrorResponse('PayPal not properly configured for this recipient', 'PAYPAL_NOT_CONFIGURED');
        }
        paymentResponse = await this.paypalProcessor.processPayment(request, recipient);
      } else {
        return this.createErrorResponse('Invalid payment method', 'INVALID_PAYMENT_METHOD');
      }

      // 5. Update donation record with payment details
      await this.updateDonationRecord(donation.id, paymentResponse);

      // 6. Return response with donation ID
      return {
        ...paymentResponse,
        donationId: donation.id
      };
    } catch (error) {
      logger.error('Payment processing error:', error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        'PAYMENT_PROCESSING_ERROR'
      );
    }
  }

  /**
   * Get recipient details from the database
   */
  private async getRecipient(recipientId: string): Promise<PaymentRecipient | null> {
    return prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        name: true,
        email: true,
        donationMethod: true,
        donationLink: true,
        donationsEnabled: true
      }
    });
  }

  /**
   * Create a donation record in the database
   */
  private async createDonationRecord(request: PaymentRequest, paymentMethod: PaymentMethod | null) {
    return prisma.donation.create({
      data: {
        donorId: request.donorId,
        recipientId: request.recipientId,
        amount: request.amount,
        message: request.message || null,
        status: 'pending',
        paymentMethod: paymentMethod || undefined,
      }
    });
  }

  /**
   * Update donation record with payment details
   */
  private async updateDonationRecord(donationId: string, response: PaymentResponse) {
    const updateData: any = {};
    
    if (response.processorType === 'stripe' && response.clientSecret) {
      // Extract payment intent ID from client secret
      const paymentIntentId = response.clientSecret.split('_secret')[0];
      updateData.stripePaymentIntentId = paymentIntentId;
    }

    if (!response.success) {
      updateData.status = 'failed';
    }

    await prisma.donation.update({
      where: { id: donationId },
      data: updateData
    });
  }

  /**
   * Create an error response
   */
  private createErrorResponse(message: string, code?: string): PaymentResponse {
    return {
      success: false,
      processorType: 'stripe', // Default, will be ignored
      donationId: '', // Will be filled in by the caller
      error: message,
      errorCode: code
    };
  }
}
