import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import { SimplePayPalButton } from "./SimplePayPalButton";
import { fetchWithCsrf } from "@/lib/client/csrf";

// Helper function to get more user-friendly error descriptions
function getPayPalErrorDescription(errorMessage: string): string {
  // Convert to lowercase for easier matching
  const lowerCaseError = errorMessage.toLowerCase();

  if (lowerCaseError.includes('instrument_declined') || lowerCaseError.includes('declined')) {
    return "Your payment method was declined. Please try another payment method or check your account balance.";
  }

  if (lowerCaseError.includes('insufficient') || lowerCaseError.includes('funds')) {
    return "There might be insufficient funds in your PayPal account. Please add funds or try another payment method.";
  }

  if (lowerCaseError.includes('currency')) {
    return "There was an issue with the currency. Please try again or contact support.";
  }

  if (lowerCaseError.includes('invalid') || lowerCaseError.includes('resource')) {
    return "The payment couldn't be processed due to a technical issue. Please try again later.";
  }

  if (lowerCaseError.includes('timeout') || lowerCaseError.includes('timed out')) {
    return "The payment request timed out. Please check your internet connection and try again.";
  }

  if (lowerCaseError.includes('cancel') || lowerCaseError.includes('cancelled')) {
    return "The payment was cancelled. Please try again if you wish to complete your donation.";
  }

  // Default case
  return "There was an error processing your payment. Please try again or contact support.";
}

interface PayPalPaymentFormProps {
  recipientId: string;
  amount: number; // in cents
  message?: string;
  storyId?: string | null;
  storyTitle?: string | null;
  onSuccess: () => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

export function PayPalPaymentForm({
  recipientId,
  amount,
  message,
  storyId,
  storyTitle,
  onSuccess,
  onError,
  onCancel
}: PayPalPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkError, setSdkError] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch the recipient's PayPal link as a fallback
  const [paypalLink, setPaypalLink] = useState<string | null>(null);

  // Convert amount from cents to dollars for PayPal
  const amountInDollars = (amount / 100).toFixed(2);

  // Initialize loading state and fetch PayPal link as fallback
  useEffect(() => {
    const fetchPayPalLink = async () => {
      try {
        // Fetch the recipient's PayPal link as a fallback
        const response = await fetch(`/api/user/paypal-link?userId=${recipientId}`);
        const data = await response.json();

        if (response.ok && data.paypalLink) {
          setPaypalLink(data.paypalLink);
        }
      } catch (error) {
        logger.error('Error fetching PayPal link:', error);
      } finally {
        // Set loading to false after a short delay
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    fetchPayPalLink();

    // Set up error event listener for script loading errors
    const handleScriptError = (event: ErrorEvent) => {
      // Check if this is a PayPal script error
      if (event.filename && event.filename.includes('paypal.com/sdk/js')) {
        logger.error('PayPal script error:', event);
        // Set a timeout to ensure the state update happens after render
        setTimeout(() => {
          setSdkError(true);
          toast({
            title: "PayPal Error",
            description: "There was an error loading PayPal. Please try again later.",
            variant: "destructive",
          });
        }, 0);
      }
    };

    // Add global error event listener
    window.addEventListener('error', handleScriptError);

    return () => {
      // Clean up the event listener when component unmounts
      window.removeEventListener('error', handleScriptError);
    };
  }, [recipientId, toast]);

  // Production-ready approach for handling PayPal orders
  useEffect(() => {
    if (!createdOrderId) return;

    // Log for debugging purposes
    logger.info('Tracking PayPal order:', createdOrderId);

    // Set a reasonable timeout to check if the order was completed
    // This handles cases where the PayPal SDK fails to trigger the onApprove callback
    const timer = setTimeout(() => {
      logger.warn('PayPal order not completed after timeout:', createdOrderId);

      // Verify the order status server-side
      fetchWithCsrf('/api/payments/paypal/verify-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: createdOrderId,
        }),
      }).then(response => response.json())
        .then(data => {
          if (data.status === 'COMPLETED') {
            // The order was actually completed, record it and show success
            fetchWithCsrf('/api/donations/record-paypal', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recipientId: recipientId,
                amount: amount,
                message: message,
                paypalOrderId: createdOrderId,
                verified: true,
              }),
            }).then(() => {
              toast({
                title: "Payment Successful",
                description: "Your donation has been processed. Thank you for your support!",
                variant: "default",
              });

              // Call success callback
              onSuccess();
            });
          } else {
            // The order was not completed, show appropriate message
            logger.info('Order verification failed:', data);
            toast({
              title: "Payment Incomplete",
              description: "Your payment could not be verified. Please try again or contact support.",
              variant: "destructive",
            });
          }
        })
        .catch(error => {
          logger.error('Error verifying PayPal order:', error);
          // Don't assume success on errors
          toast({
            title: "Payment Status Unknown",
            description: "We couldn't verify your payment status. Please check your PayPal account.",
            variant: "destructive",
          });
        });
    }, 15000); // 15 seconds timeout - more reasonable for production

    return () => clearTimeout(timer);
  }, [createdOrderId, recipientId, amount, message, onSuccess, toast]);

  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    logger.error('PayPal client ID is not configured');
    console.log('PayPal client ID is not configured ');
    return null;
  }

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
    // Enable the PayPal sandbox for testing
    "enable-funding": "card",
    "disable-funding": "credit,paylater",
  };

  // Handle PayPal button approval
  const handleApprove = async (data: any, actions: any) => {
    logger.info('PayPal approve callback triggered', { orderId: data.orderID });

    // Clear the created order ID since we're now in the approve flow
    setCreatedOrderId(null);

    try {
      setIsProcessing(true);

      // Show a toast to let the user know we're processing
      toast({
        title: "Processing Payment",
        description: "Please wait while we process your payment...",
      });

      // First, capture the payment with PayPal
      const details = await actions.order.capture();
      logger.info('PayPal payment captured:', details);

      if (details?.status === "COMPLETED") {
        // Create a record of the donation in our database
        const response = await fetchWithCsrf('/api/donations/record-paypal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientId: recipientId,
            amount: amount,
            message: message,
            storyId: storyId,
            paypalOrderId: data.orderID,
            paypalTransactionId: details.purchase_units[0]?.payments?.captures[0]?.id,
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          // The payment was successful, but we failed to record it
          // We should still consider this a success from the user's perspective
          logger.error('Failed to record PayPal payment:', responseData);
        }

        // Payment successful - show a toast notification
        toast({
          title: "Payment Successful!",
          description: "Your donation has been processed successfully. Thank you for your support!",
          variant: "default",
        });

        // Add a small delay before calling onSuccess to ensure the user sees the toast
        setTimeout(() => {

          onSuccess();
        }, 1500);
      } else {
        throw new Error("Payment was not completed");
      }
    } catch (error) {
      logger.error('Error capturing PayPal payment:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });

      onError(error instanceof Error ? error : new Error('Failed to capture PayPal payment'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Render a fallback UI if the PayPal SDK fails
  const renderFallbackUI = () => {
    if (!paypalLink) {
      return (
        <div className="p-4 border border-destructive rounded-md bg-destructive/10 text-destructive">
          <p>Unable to load PayPal. Please try again later or contact support.</p>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    // Use our simple PayPal button component
    return (
      <SimplePayPalButton
        recipientId={recipientId}
        amount={amount}
        message={message}
        paypalLink={paypalLink}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );
  };

  return (
    <div className="w-full">

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-center text-muted-foreground">
            Preparing PayPal payment...
          </p>
        </div>
      ) : sdkError ? (
        renderFallbackUI()
      ) : (
        <PayPalScriptProvider
          options={initialOptions}
          deferLoading={false}>
          <div className="py-4">
            <p className="text-center text-muted-foreground mb-4">
              Donate ${amountInDollars} with PayPal
            </p>

            {/* Wrap PayPal buttons in a try-catch to handle rendering errors */}
            {(() => {
              try {
                return (
                  <PayPalButtons
                    style={{ layout: "vertical", shape: "rect" }}
                    disabled={isProcessing}
                    forceReRender={[amountInDollars]}
                    createOrder={(_data, actions) => {
                      logger.info('Creating PayPal order');
                      // Create a PayPal order directly using the SDK
                      try {
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [
                            {
                              amount: {
                                value: amountInDollars,
                                currency_code: "USD"
                              },
                              description: storyTitle
                                ? `Donation for story: ${storyTitle}`
                                : `Donation to creator`
                            },
                          ],
                          application_context: {
                            shipping_preference: "NO_SHIPPING"
                          },
                        }).then(orderId => {
                          logger.info('PayPal order created successfully:', orderId);
                          // Store the order ID for tracking
                          setCreatedOrderId(orderId);
                          return orderId;
                        }).catch(err => {
                          logger.error('Error creating PayPal order:', err);
                          // Check for specific error messages that might indicate insufficient funds
                          const errorMessage = err?.message || String(err);
                          if (errorMessage.includes('INSTRUMENT_DECLINED') ||
                              errorMessage.includes('insufficient') ||
                              errorMessage.includes('funds')) {
                            toast({
                              title: "Payment Failed",
                              description: "There might be insufficient funds in your PayPal account. Please try another payment method.",
                              variant: "destructive",
                            });
                          }
                          throw err;
                        });
                      } catch (error) {
                        logger.error('Error creating PayPal order:', error);
                        toast({
                          title: "PayPal Error",
                          description: "There was an error setting up the payment. Please try again.",
                          variant: "destructive",
                        });
                        throw error;
                      }
                    }}
                    onCancel={(data) => {
                      logger.info('Payment cancelled by user', data);
                      toast({
                        title: "Payment Cancelled",
                        description: "You have cancelled the payment process",
                      });
                      onCancel();
                    }}
                    onError={(err) => {
                      logger.error('PayPal error callback triggered', err);
                      const errorMessage = typeof err === 'string' ? err : err instanceof Error ? err.message : 'An unknown error occurred';

                      // Check for specific error messages
                      if (errorMessage.includes('INVALID_RESOURCE_ID') ||
                          errorMessage.includes('Things don\'t appear to be working') ||
                          errorMessage.includes('instrument_declined') ||
                          errorMessage.includes('INSTRUMENT_DECLINED') ||
                          errorMessage.includes('insufficient') ||
                          errorMessage.includes('funds') ||
                          errorMessage.includes('Failed to initialize') ||
                          errorMessage.includes('atob') ||
                          errorMessage.includes('InvalidCharacterError')) {
                        // Show fallback UI for these specific errors
                        setSdkError(true);
                      } else {
                        // For other errors, show a more detailed toast
                        const errorDescription = getPayPalErrorDescription(errorMessage);
                        toast({
                          title: "PayPal Error",
                          description: errorDescription || "There was an error processing your payment. Please try again.",
                          variant: "destructive",
                        });
                      }

                      onError(new Error(errorMessage));
                    }}
                    onApprove={handleApprove}
                  />
                );
              } catch (error) {
                logger.error('Error rendering PayPal buttons:', error);
                // If there's an error rendering the buttons, show the fallback UI
                setTimeout(() => setSdkError(true), 0);
                return <div>Loading payment options...</div>;
              }
            })()}

            {isProcessing && (
              <div className="mt-4 flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Processing payment...</span>
              </div>
            )}
          </div>
        </PayPalScriptProvider>
      )}
    </div>
  );
}
