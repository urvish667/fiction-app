/**
 * Common payment types and interfaces for the unified payment gateway
 */

export type PaymentMethod = 'STRIPE' | 'PAYPAL' | 'BMC' | 'KOFI';

export interface PaymentRecipient {
  id: string;
  name?: string | null;
  email?: string | null;
  donationMethod: PaymentMethod | null;
  donationLink: string | null;
  donationsEnabled: boolean;
}

export interface PaymentRequest {
  amount: number; // Amount in cents
  recipientId: string;
  message?: string;
  storyId?: string;
  donorId: string;
}

export interface PaymentResponse {
  success: boolean;
  processorType: PaymentMethod;
  donationId?: string; // Optional, as it's created after the processor runs
  // For Stripe
  clientSecret?: string;
  // For PayPal
  paypalOrderId?: string;
  // Error information
  error?: string;
  errorCode?: string;
}

export interface PaymentProcessor {
  processPayment(
    request: PaymentRequest,
    recipient: PaymentRecipient
  ): Promise<PaymentResponse>;

  validatePaymentSetup(recipient: PaymentRecipient): boolean;
}
