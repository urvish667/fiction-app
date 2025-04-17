'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SupportButtonProps {
  authorId: string;
  donationMethod: 'paypal' | 'stripe' | null;
  donationLink: string | null;
  authorName?: string;
}

export function SupportButton({
  authorId,
  donationMethod,
  donationLink,
  authorName
}: SupportButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Don't render if donations are not enabled
  if (!donationMethod || !donationLink) {
    return null;
  }

  const handleDonation = async () => {
    setIsProcessing(true);
    try {
      // Fixed amount for now
      const amountInCents = 500;

      const response = await fetch('/api/donations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: authorId,
          amount: amountInCents,
          paymentMethod: donationMethod
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Could not initiate donation. Please try again.');
      }

      if (data.paypalLink) {
        // Redirect to PayPal
        window.location.href = data.paypalLink;
      } else if (data.clientSecret) {
        // Handle Stripe payment
        router.push(`/donate/${authorId}?payment_intent=${data.clientSecret}`);
      } else {
        throw new Error('Invalid payment response');
      }

    } catch (error) {
      console.error('[DONATION_ERROR]', error);
      toast({
        title: 'Donation Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const buttonText = `Support ${authorName || 'the Author'}`;

  return (
    <Button
      onClick={handleDonation}
      disabled={isProcessing}
      variant="outline"
      className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600"
    >
      {isProcessing ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Heart className="mr-2 h-4 w-4" />
      )}
      {isProcessing ? 'Processing...' : buttonText}
    </Button>
  );
}