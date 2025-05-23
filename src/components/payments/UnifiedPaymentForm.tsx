"use client"

import { useState, useEffect } from "react"
import { StripePaymentForm } from "./StripePaymentForm"
import { PayPalPaymentForm } from "./PayPalPaymentForm"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { fetchWithCsrf } from "@/lib/client/csrf"

interface UnifiedPaymentFormProps {
  recipientId: string
  amount: number // in cents
  message?: string
  storyId?: string | null
  storyTitle?: string | null
  onSuccess: () => void
  onError: (error: Error) => void
  onCancel: () => void
}

/**
 * A unified payment form that handles both Stripe and PayPal payments
 * through a single interface
 */
export function UnifiedPaymentForm({
  recipientId,
  amount,
  message,
  storyId,
  storyTitle,
  onSuccess,
  onError,
  onCancel
}: UnifiedPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | null>(null)

  const processPayment = async () => {
    try {
      setIsProcessing(true)
      setError(null)
      // First, get the recipient's preferred payment method
      const response = await fetch(`/api/user/payment-method?userId=${recipientId}`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get payment method')
      }

      // Set the payment method
      setPaymentMethod(data.paymentMethod)

      // For Stripe, we need to create a payment intent
      if (data.paymentMethod === 'stripe') {
        // Stripe is temporarily disabled
        throw new Error('Stripe payments are temporarily disabled. Please contact the creator for alternative payment methods.')
      }
    } catch (error) {
      // Get the error message
      let errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      // Check for specific error messages and provide more helpful information
      if (errorMessage.includes("destination charges with accounts in IN")) {
        errorMessage = "This creator's payment account is in India, which doesn't currently support direct payments. Please contact the creator for alternative payment methods.";
      }

      setError(errorMessage);
      onError(error instanceof Error ? new Error(errorMessage) : new Error('Payment processing failed'));
    } finally {
      setIsProcessing(false)
    }
  }

  // Process payment when the component mounts
  useEffect(() => {
    processPayment()
  }, [])

  // If we have determined the payment method, show the appropriate form
  if (paymentMethod === 'stripe' && clientSecret && clientSecret !== 'paypal') {
    // Stripe is disabled, show error message
    return (
      <div className="payment-form-container">
        <div className="p-4 border border-destructive rounded-md bg-destructive/10 text-destructive">
          <p>Stripe payments are temporarily disabled. Please contact the creator for alternative payment methods.</p>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  } else if (paymentMethod === 'paypal' || clientSecret === 'paypal') {
    return (
      <div className="payment-form-container">
        <PayPalPaymentForm
          recipientId={recipientId}
          amount={amount}
          message={message}
          storyId={storyId}
          storyTitle={storyTitle}
          onSuccess={onSuccess}
          onError={(error) => {
            setError(error.message)
            onError(error)
          }}
          onCancel={onCancel}
        />
      </div>
    )
  }

  // Show loading or error state
  return (
    <div className="space-y-4">
      {error ? (
        <div className="p-4 border border-destructive rounded-md bg-destructive/10 text-destructive">
          <p>{error}</p>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={processPayment} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Try Again'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-center text-muted-foreground">
            Preparing your payment...
          </p>
        </div>
      )}
    </div>
  )
}
