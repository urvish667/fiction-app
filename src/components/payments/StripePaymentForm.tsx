"use client"

import { useState, useEffect } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { logger } from "@/lib/logger"

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
}

function PaymentForm({ onSuccess, onError }: Omit<StripePaymentFormProps, 'clientSecret'>) {
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
        const errorMessage = submitError.message || 'Please check your payment details';
        setError(errorMessage);
        toast({
          title: "Payment Error",
          description: errorMessage,
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
        const errorMessage = result.error.message || 'Payment could not be processed';
        setError(errorMessage);
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
        });
        onError(new Error(errorMessage));
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
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      onError(new Error(errorMessage));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
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

export function StripePaymentForm({ clientSecret, onSuccess, onError }: StripePaymentFormProps) {
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
        <PaymentForm onSuccess={onSuccess} onError={onError} />
      </Elements>
    </div>
  );
}
