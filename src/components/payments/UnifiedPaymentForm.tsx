"use client"

import { useEffect } from "react";
import { PayPalPaymentForm } from "./PayPalPaymentForm"
import { StripePaymentForm } from "./StripePaymentForm"

// File: `src/components/payments/UnifiedPaymentForm.tsx`

type PaymentMethod = 'STRIPE' | 'PAYPAL';

interface UnifiedPaymentFormProps {
  paymentMethod: PaymentMethod;
  clientSecret?: string | null; // Optional: only for Stripe
  paypalOrderId?: string | null; // Optional: only for PayPal
  recipientId: string;
  amount: number; // in cents
  message?: string;
  storyId?: string | null;
  storyTitle?: string | null;
  onSuccess: () => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

/**
 * A unified payment form that handles both Stripe and PayPal payments
 * through a single interface
 */
export function UnifiedPaymentForm({
  paymentMethod,
  clientSecret,
  paypalOrderId,
  recipientId,
  amount,
  message,
  storyId,
  storyTitle,
  onSuccess,
  onError,
  onCancel,
}: UnifiedPaymentFormProps) {
  useEffect(() => {
    if (paymentMethod === 'STRIPE' && !clientSecret) {
      onError(new Error('Stripe client secret is missing.'));
    }
    if (paymentMethod === 'PAYPAL' && !paypalOrderId) {
      onError(new Error('PayPal Order ID is missing.'));
    }
  }, [paymentMethod, clientSecret, paypalOrderId, onError]);

  if (paymentMethod === 'STRIPE') {
    if (!clientSecret) {
      return null; // Or return an error message component
    }
    return (
      <StripePaymentForm
        clientSecret={clientSecret}
        recipientId={recipientId}
        amount={amount}
        message={message}
        storyId={storyId}
        storyTitle={storyTitle}
        onSuccess={onSuccess}
        onError={onError}
      />
    );
  }

  if (paymentMethod === 'PAYPAL') {
    if (!paypalOrderId) {
      return null;
    }
    return (
      <PayPalPaymentForm
        paypalOrderId={paypalOrderId}
        recipientId={recipientId}
        amount={amount}
        message={message}
        storyId={storyId}
        storyTitle={storyTitle}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    );
  }

  // Fallback or initial state
  return null;
}
