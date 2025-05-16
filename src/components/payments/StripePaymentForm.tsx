"use client"

import { useState, useEffect } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe, StripeError } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { logger } from "@/lib/logger"

/**
 * Get a user-friendly error message for Stripe errors
 * @param error The Stripe error object
 * @returns A user-friendly error message
 */
function getStripeErrorMessage(error: StripeError | any): string {
  // Default message if we can't provide a more specific one
  let message = error.message || 'Payment could not be processed';

  // Special case for the India destination charges error - check this first
  // regardless of error code structure
  if (typeof message === 'string' && message.includes("destination charges with accounts in IN")) {
    return "This creator's payment account is in India, which doesn't currently support direct payments. Please contact the creator for alternative payment methods.";
  }

  // Check for specific error codes and provide helpful messages
  if (error.code) {
    switch (error.code) {
      case 'charge_invalid_parameter':
        return "There was an issue with the payment parameters. Please try again or contact support.";
      case 'card_declined':
        return "Your card was declined. Please check your card details or try another payment method.";
      case 'expired_card':
        return "Your card has expired. Please use a different card.";
      case 'incorrect_cvc':
        return "The security code (CVC) is incorrect. Please check and try again.";
      case 'processing_error':
        return "An error occurred while processing your card. Please try again or use a different payment method.";
      case 'rate_limit':
        return "Too many payment attempts. Please wait a moment before trying again.";
      case 'invalid_request_error':
        if (message.includes("country")) {
          return "There's an issue with the country settings for this payment. Please contact support.";
        }
        break;
    }
  }

  // If we get here, return the original message
  return message;
}

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

if (typeof window !== 'undefined') {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    logger.warn('Stripe publishable key is not configured. Stripe payments will not work.');
  } else {
    stripePromise = loadStripe(publishableKey);
  }
}

interface StripePaymentFormProps {
  clientSecret: string
  onSuccess: () => void
  onError: (error: Error) => void
  storyTitle?: string | null
}

function PaymentForm({ onSuccess, onError, storyTitle }: Omit<StripePaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Prevent multiple submissions
    if (isProcessing) return;

    // Validate stripe and elements are available
    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Payment system is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Set processing state
      setIsProcessing(true);
      setError(null);

      // Show processing toast
      toast({
        title: "Processing Payment",
        description: "Please wait while we process your payment...",
      });

      // 1. First validate the payment element
      const { error: submitError } = await elements.submit();
      if (submitError) {
        logger.error('Form submission error:', submitError);

        // Get user-friendly error message
        const friendlyErrorMessage = getStripeErrorMessage(submitError);

        setError(friendlyErrorMessage);
        toast({
          title: "Payment Error",
          description: friendlyErrorMessage,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // 2. Confirm the payment
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Redirect to the completion page
          return_url: `${window.location.origin}/donate/success`,
        },
        redirect: 'if_required',
      });

      // 3. Handle the result
      if (result.error) {
        // Show error to your customer
        logger.error('Payment confirmation error:', result.error);

        // Special check for India destination charges error
        let friendlyErrorMessage = '';
        if (result.error.message && result.error.message.includes("destination charges with accounts in IN")) {
          friendlyErrorMessage = "This creator's payment account is in India, which doesn't currently support direct payments. Please contact the creator for alternative payment methods.";
        } else {
          // Get user-friendly error message for other errors
          friendlyErrorMessage = getStripeErrorMessage(result.error);
        }

        // Set the error message in the form
        setError(friendlyErrorMessage);

        // Show toast with user-friendly error message
        toast({
          title: "Payment Failed",
          description: friendlyErrorMessage,
          variant: "destructive",
          duration: 10000, // 10 seconds
        });

        // Pass the error to the parent component
        onError(new Error(friendlyErrorMessage));
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Payment succeeded
        toast({
          title: "Payment Successful!",
          description: "Your donation has been processed successfully. Thank you for your support!",
          variant: "default",
        });

        // Add a small delay before calling onSuccess to ensure the user sees the toast
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      // Handle unexpected errors
      const error = err as Error;
      logger.error('Unexpected error:', error);

      // Check if this is a Stripe error that we can parse
      let errorMessage = 'An unexpected error occurred';

      // First check for the specific India destination charges error
      if (error.message && error.message.includes("destination charges with accounts in IN")) {
        errorMessage = "This creator's payment account is in India, which doesn't currently support direct payments. Please contact the creator for alternative payment methods.";
      }
      // Then check if it's a Stripe error object
      else if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
        // This might be a Stripe error object
        errorMessage = getStripeErrorMessage(err as unknown as StripeError);
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }

      // Set the error in the form
      setError(errorMessage);

      // Show a toast with the error message
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // 10 seconds
      });

      // Pass the error to the parent component
      onError(new Error(errorMessage));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-4">
        {storyTitle && (
          <div className="mb-4 p-3 bg-muted/50 rounded-md">
            <p className="text-sm">Donation for story: <span className="font-semibold">{storyTitle}</span></p>
          </div>
        )}
        <PaymentElement />
      </div>
      {error && (
        <div className="text-sm text-destructive mt-2">
          {error}
        </div>
      )}
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  )
}

export function StripePaymentForm({ clientSecret, onSuccess, onError, storyTitle }: StripePaymentFormProps) {
  const { toast } = useToast();
  const [isReady, setIsReady] = useState(false);

  // Add a small delay to ensure the component is fully mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!stripePromise) {
    toast({
      title: "Configuration Error",
      description: "Stripe is not configured. Please contact support.",
      variant: "destructive",
    });
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Stripe is not configured. Please contact support.</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-center text-muted-foreground">
          Preparing payment form...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">

      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm onSuccess={onSuccess} onError={onError} storyTitle={storyTitle} />
      </Elements>
    </div>
  );
}
