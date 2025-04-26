import { PaymentProcessor, PaymentRequest, PaymentResponse, PaymentRecipient } from '../types';
import { logger } from '@/lib/logger';

/**
 * PayPal payment processor implementation
 */
export class PayPalPaymentProcessor implements PaymentProcessor {
  /**
   * Process a payment using PayPal
   * This implementation doesn't redirect to PayPal.me links anymore
   * Instead, it returns a success response that will trigger the PayPalPaymentForm
   * component to be rendered, which uses the PayPal JavaScript SDK
   */
  async processPayment(
    request: PaymentRequest,
    recipient: PaymentRecipient
  ): Promise<PaymentResponse> {
    try {
      // Validate recipient has PayPal configured
      if (!this.validatePaymentSetup(recipient)) {
        return {
          success: false,
          processorType: 'paypal',
          donationId: '',
          error: 'PayPal not properly configured for this recipient',
          errorCode: 'PAYPAL_NOT_CONFIGURED'
        };
      }

      // Log that we're using the in-app PayPal integration
      logger.info('Using in-app PayPal integration for recipient:', {
        recipientId: recipient.id,
        donationMethod: recipient.donationMethod
      });

      // Return a success response that will trigger the PayPalPaymentForm
      // The actual PayPal order creation will happen in the PayPalPaymentForm component
      return {
        success: true,
        processorType: 'paypal',
        donationId: '',
      };
    } catch (error) {
      logger.error('PayPal payment processing error:', error);

      // Handle generic errors
      return {
        success: false,
        processorType: 'paypal',
        donationId: '',
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        errorCode: 'PAYMENT_PROCESSING_ERROR'
      };
    }
  }

  /**
   * Validate that the recipient has PayPal properly configured
   */
  validatePaymentSetup(recipient: PaymentRecipient): boolean {
    return (
      recipient.donationMethod === 'paypal' &&
      !!recipient.donationLink &&
      recipient.donationsEnabled
    );
  }
}
