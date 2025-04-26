import Stripe from 'stripe';
import { PaymentProcessor, PaymentRequest, PaymentResponse, PaymentRecipient } from '../types';
import { logger } from '@/lib/logger';

/**
 * Stripe payment processor implementation
 */
export class StripePaymentProcessor implements PaymentProcessor {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Process a payment using Stripe
   */
  async processPayment(
    request: PaymentRequest,
    recipient: PaymentRecipient
  ): Promise<PaymentResponse> {
    try {
      // Validate recipient has Stripe configured
      if (!this.validatePaymentSetup(recipient)) {
        return {
          success: false,
          processorType: 'stripe',
          donationId: '',
          error: 'Stripe not properly configured for this recipient',
          errorCode: 'STRIPE_NOT_CONFIGURED'
        };
      }

      // Get Stripe account ID from donation link
      const stripeAccountId = recipient.donationLink;

      // Ensure stripeAccountId is not null
      if (!stripeAccountId) {
        return {
          success: false,
          processorType: 'stripe',
          donationId: '',
          error: 'Stripe account ID is missing',
          errorCode: 'STRIPE_ACCOUNT_MISSING'
        };
      }

      // Create a payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: request.amount,
        currency: 'usd',
        application_fee_amount: 0, // No platform fee
        transfer_data: {
          destination: stripeAccountId,
        },
        metadata: {
          donorId: request.donorId,
          recipientId: request.recipientId,
          message: request.message || '',
        },
        automatic_payment_methods: {
          enabled: true,
        },
        // Add description for Indian export regulations
        description: `Donation to ${recipient.name || 'Creator'} - Support for creative content`,
        // Add shipping information for Indian export regulations
        shipping: {
          name: 'Digital Service',
          address: {
            line1: 'Digital Content',
            city: 'Internet',
            postal_code: '000000',
            state: 'NA',
            country: 'US',
          },
        },
      });

      // Return successful response
      return {
        success: true,
        processorType: 'stripe',
        donationId: '',
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error) {
      logger.error('Stripe payment processing error:', error);

      // Handle specific Stripe errors
      if (error instanceof Stripe.errors.StripeError) {
        return {
          success: false,
          processorType: 'stripe',
          donationId: '',
          error: error.message,
          errorCode: error.code || 'STRIPE_ERROR'
        };
      }

      // Handle generic errors
      return {
        success: false,
        processorType: 'stripe',
        donationId: '',
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        errorCode: 'PAYMENT_PROCESSING_ERROR'
      };
    }
  }

  /**
   * Validate that the recipient has Stripe properly configured
   */
  validatePaymentSetup(recipient: PaymentRecipient): boolean {
    return (
      recipient.donationMethod === 'stripe' &&
      !!recipient.donationLink &&
      recipient.donationsEnabled
    );
  }
}
