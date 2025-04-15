"use client"

import { useState } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

if (typeof window !== 'undefined') {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.warn('Stripe publishable key is not configured. Stripe payments will not work.');
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
    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Payment system is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('Form submission error:', submitError);
        const errorMessage = submitError.message || 'Please check your payment details';
        setError(errorMessage);
        toast({
          title: "Payment Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/complete`,
        },
      });

      if (paymentError) {
        console.error('Payment confirmation error:', paymentError);
        const errorMessage = paymentError.message || 'Payment could not be processed';
        setError(errorMessage);
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
        });
        onError(new Error(errorMessage));
      } else {
        // Payment successful
        toast({
          title: "Success",
          description: "Payment processed successfully",
        });
        onSuccess();
      }
    } catch (err) {
      const error = err as Error;
      console.error('Unexpected error:', error);
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

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
} 