import { PaymentProcessor, PaymentRequest, PaymentResponse, PaymentRecipient } from '../types';
import { logger } from '@/lib/logger';

/**
 * PayPal payment processor implementation
 * File: src/lib/payment/processors/paypalProcessor.ts
 */
export class PayPalPaymentProcessor implements PaymentProcessor {
  private getApiBaseUrl(): string {
    return process.env.NODE_ENV === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private async getAccessToken(): Promise<string> {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${this.getApiBaseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('Failed to get PayPal access token', { status: response.status, body: errorBody });
      throw new Error('Failed to authenticate with PayPal');
    }

    const data = await response.json();
    return data.access_token;
  }

  async processPayment(
    request: PaymentRequest,
    recipient: PaymentRecipient
  ): Promise<PaymentResponse> {
    try {
      if (!this.validatePaymentSetup(recipient)) {
        return {
          success: false,
          processorType: 'PAYPAL',
          error: 'PayPal not properly configured for this recipient',
          errorCode: 'PAYPAL_NOT_CONFIGURED',
        };
      }

      const accessToken = await this.getAccessToken();
      const amountInDollars = (request.amount / 100).toFixed(2);

      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amountInDollars,
            },
            payee: {
              email_address: recipient.donationLink, // The payee email is stored in donationLink
            },
          },
        ],
      };

      const response = await fetch(`${this.getApiBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        let errorBody: any = null;
        try {
          errorBody = await response.json();
        } catch (_) {
          errorBody = await response.text();
        }
        logger.error('Failed to create PayPal order', { 
          status: response.status, 
          error: errorBody 
        });
        let errorMsg = 'Failed to create PayPal order.';
        if (errorBody && errorBody.message) {
          errorMsg += ` PayPal API: ${errorBody.message}`;
        } else if (typeof errorBody === 'string') {
          errorMsg += ` PayPal API: ${errorBody}`;
        }
        return {
          success: false,
          processorType: 'PAYPAL',
          error: errorMsg,
          errorCode: 'PAYPAL_ORDER_CREATION_FAILED',
        };
      }

      const order = await response.json();
      if (!order || !order.id) {
        logger.error('PayPal order creation succeeded but no order ID returned', { order });
        return {
          success: false,
          processorType: 'PAYPAL',
          error: 'PayPal order was created but no order ID was returned. Please check PayPal API response and recipient configuration.',
          errorCode: 'PAYPAL_ORDER_ID_MISSING',
        };
      }

      return {
        success: true,
        processorType: 'PAYPAL',
        paypalOrderId: order.id,
      };
    } catch (error) {
      logger.error('PayPal payment processing error:', error);
      return {
        success: false,
        processorType: 'PAYPAL',
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        errorCode: 'PAYMENT_PROCESSING_ERROR',
      };
    }
  }

  validatePaymentSetup(recipient: PaymentRecipient): boolean {
    return (
      recipient.donationMethod === 'PAYPAL' &&
      !!recipient.donationLink && // This should be the PayPal payee email
      recipient.donationsEnabled
    );
  }
}
