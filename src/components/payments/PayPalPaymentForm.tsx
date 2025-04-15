import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PayPalPaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export function PayPalPaymentForm({ amount, onSuccess, onError }: PayPalPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    console.error('PayPal client ID is not configured');
    return null;
  }

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtons
        style={{ layout: "vertical" }}
        disabled={isProcessing}
        forceReRender={[amount]}
        createOrder={(data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  value: (amount / 100).toFixed(2), // Convert cents to dollars
                  currency_code: "USD",
                },
              },
            ],
          });
        }}
        onApprove={async (data, actions) => {
          try {
            setIsProcessing(true);
            const details = await actions.order?.capture();
            if (details?.status === "COMPLETED") {
              onSuccess();
            } else {
              throw new Error("Payment was not completed");
            }
          } catch (error) {
            onError(error instanceof Error ? error : new Error("Payment failed"));
          } finally {
            setIsProcessing(false);
          }
        }}
        onError={(err) => {
          const errorMessage = typeof err === 'string' ? err : err instanceof Error ? err.message : 'An unknown error occurred';
          onError(new Error(errorMessage));
        }}
      />
      {isProcessing && (
        <div className="mt-4 flex items-center justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Processing payment...</span>
        </div>
      )}
    </PayPalScriptProvider>
  );
} 