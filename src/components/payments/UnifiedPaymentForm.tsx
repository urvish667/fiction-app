"use client"

import { useState, useEffect } from "react"
import { StripePaymentForm } from "./StripePaymentForm"
import { PayPalPaymentForm } from "./PayPalPaymentForm"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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
  const [paypalLink, setPaypalLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | null>(null)

  const processPayment = async () => {
    console.log('[UNIFIED_PAYMENT_PROCESS] Starting payment process');
    try {
      setIsProcessing(true)
      setError(null)
      console.log('[UNIFIED_PAYMENT_STATE] Set processing to true')

      console.log('[UNIFIED_PAYMENT_METHOD_FETCH] Fetching recipient payment method');
      // First, get the recipient's preferred payment method
      const response = await fetch(`/api/user/payment-method?userId=${recipientId}`, {
        method: 'GET',
      })

      const data = await response.json()
      console.log('[UNIFIED_PAYMENT_METHOD_RESPONSE]', data)

      if (!response.ok) {
        console.log('[UNIFIED_PAYMENT_METHOD_ERROR]', data.message)
        throw new Error(data.message || 'Failed to get payment method')
      }

      console.log('[UNIFIED_PAYMENT_METHOD_SET]', data.paymentMethod)
      // Set the payment method
      setPaymentMethod(data.paymentMethod)

      // For Stripe, we need to create a payment intent
      if (data.paymentMethod === 'stripe') {
        console.log('[UNIFIED_PAYMENT_STRIPE] Creating Stripe payment intent');
        const stripeResponse = await fetch('/api/donations/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientId,
            amount,
            message,
            storyId,
          }),
        })

        const stripeData = await stripeResponse.json()
        console.log('[UNIFIED_PAYMENT_STRIPE_RESPONSE]', stripeData)

        if (!stripeResponse.ok) {
          console.log('[UNIFIED_PAYMENT_STRIPE_ERROR]', stripeData.message)
          throw new Error(stripeData.message || 'Failed to process payment')
        }

        // Set the client secret for the Stripe form
        if (stripeData.clientSecret) {
          console.log('[UNIFIED_PAYMENT_STRIPE_SUCCESS] Got client secret')
          setClientSecret(stripeData.clientSecret)
        } else {
          console.log('[UNIFIED_PAYMENT_STRIPE_ERROR] No client secret in response')
          throw new Error('Invalid payment response')
        }
      }

      // For PayPal, the PayPalPaymentForm component will handle the API calls
      if (data.paymentMethod === 'paypal') {
        console.log('[UNIFIED_PAYMENT_PAYPAL] Using PayPal payment method');
      }
    } catch (error) {
      console.log('[UNIFIED_PAYMENT_ERROR]', error)
      console.error('Payment processing error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      onError(error instanceof Error ? error : new Error('Payment processing failed'))
    } finally {
      console.log('[UNIFIED_PAYMENT_COMPLETE] Payment process completed')
      setIsProcessing(false)
    }
  }

  // Process payment when the component mounts
  useEffect(() => {
    processPayment()
  }, [])

  // If we have determined the payment method, show the appropriate form
  if (paymentMethod === 'stripe' && clientSecret && clientSecret !== 'paypal') {
    return (
      <div className="payment-form-container">
        <StripePaymentForm
          clientSecret={clientSecret}
          onSuccess={onSuccess}
          onError={(error) => {
            setError(error.message)
            onError(error)
          }}
          storyTitle={storyTitle}
        />
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
