'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';
import { fetchWithCsrf } from '@/lib/client/csrf';

interface SimplePayPalButtonProps {
  recipientId: string;
  amount: number;
  message?: string;
  storyId?: string | null;
  storyTitle?: string | null;
  paypalLink: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SimplePayPalButton({
  recipientId,
  amount,
  message,
  storyId,
  storyTitle,
  paypalLink,
  onSuccess,
  onCancel
}: SimplePayPalButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Convert amount from cents to dollars
  const amountInDollars = (amount / 100).toFixed(2);

  // Format the PayPal link
  let formattedLink = paypalLink;
  if (formattedLink.includes('@')) {
    formattedLink = `https://www.paypal.com/paypalme/my/profile`;
  } else if (!formattedLink.includes('paypal.me/') && !formattedLink.includes('http')) {
    formattedLink = `https://www.paypal.me/${formattedLink}`;
  } else if (formattedLink.startsWith('paypal.me/')) {
    formattedLink = `https://www.${formattedLink}`;
  }

  // Add amount to the link if possible
  if (formattedLink.includes('paypal.me/')) {
    formattedLink = `${formattedLink}/${amountInDollars}`;
  }

  const handleDonation = async () => {
    try {
      setIsProcessing(true);

      // Show a processing toast
      toast({
        title: "Processing Donation",
        description: "Preparing your PayPal donation...",
      });

      // Record the donation in our database before redirecting
      const response = await fetchWithCsrf('/api/donations/record-paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          amount,
          message,
          storyId,
          paypalOrderId: `MANUAL_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        logger.error('Failed to record PayPal donation:', data);
        // Continue anyway - we'll redirect the user to PayPal
      }

      // Show redirect toast
      toast({
        title: "Redirecting to PayPal",
        description: "You'll be redirected to PayPal to complete your donation.",
      });

      // Add a small delay to ensure the toast is seen
      setTimeout(() => {
        // Open PayPal in a new window
        window.open(formattedLink, '_blank');

        // Show final success message
        toast({
          title: "Thank You!",
          description: "Your donation is being processed. Thank you for your support!",
          variant: "default",
        });

        // Consider the donation successful after a short delay
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }, 1000);
    } catch (error) {
      logger.error('Error processing PayPal donation:', error);
      toast({
        title: "Error",
        description: "There was an error processing your donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 border rounded-md">

      <p className="mb-4 text-center">Donate securely with PayPal:</p>
      <div className="flex justify-center mb-4">
        <Button
          onClick={handleDonation}
          disabled={isProcessing}
          className="bg-[#0070ba] hover:bg-[#003087] text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Donate $${amountInDollars} with PayPal`
          )}
        </Button>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        You will be redirected to PayPal to complete your donation.
      </p>
      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
