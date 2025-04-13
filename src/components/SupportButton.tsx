'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Heart } from 'lucide-react'; // Example icons

interface SupportButtonProps {
  authorId: string;
  donationMethod: 'paypal' | 'stripe' | null;
  donationLink: string | null;
  authorName?: string; // Optional: for more descriptive text
}

export function SupportButton({
  authorId,
  donationMethod,
  donationLink,
  authorName
}: SupportButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Don't render if method or required link/id is missing
  if (!donationMethod || (donationMethod === 'paypal' && !donationLink) || (donationMethod === 'stripe' && !authorId)) {
    // Silently return null if props are invalid/missing
    return null; 
  }

  const handleStripeDonation = async () => {
    setIsProcessing(true);
    try {
      // Fixed amount for now
      const amountInCents = 500; 

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          authorId: authorId, 
          amount: amountInCents 
        }),
      });

      if (!response.ok) {
        let errorMsg = 'Could not initiate Stripe donation. Please try again.';
        try {
            const errorData = await response.json();
            errorMsg = errorData?.message || errorData?.errors?.[0]?.message || errorMsg;
        } catch (e) { /* Ignore JSON parsing error */ }
        throw new Error(errorMsg);
      }

      const session = await response.json();

      if (session.url) {
        // Redirect user to Stripe Checkout
        window.location.href = session.url;
      } else {
        throw new Error('Could not retrieve Stripe Checkout URL.');
      }

    } catch (error) {
      console.error('[STRIPE_DONATION_ERROR]', error);
      toast({
        title: 'Donation Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setIsProcessing(false); // Reset processing state on error
    }
  };

  const buttonText = `Support ${authorName || 'the Author'}`;

  if (donationMethod === 'paypal') {
    let paypalHref = '';
    if (donationLink) {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donationLink);
        if (isEmail) {
            paypalHref = `mailto:${donationLink}`;
        } else {
            // It's not an email, assume URL (like paypal.me/...)
            // Ensure it has a protocol for absolute linking
            if (!donationLink.startsWith('http://') && !donationLink.startsWith('https://')) {
                paypalHref = `https://${donationLink}`;
            } else {
                paypalHref = donationLink;
            }
        }
    }

    // Render only if we have a valid href
    if (!paypalHref) return null;

    return (
      <Button asChild variant="outline">
        <a href={paypalHref} target="_blank" rel="noopener noreferrer">
          <Heart className="mr-2 h-4 w-4" /> {buttonText} (PayPal)
        </a>
      </Button>
    );
  }

  if (donationMethod === 'stripe') {
    return (
      <Button onClick={handleStripeDonation} disabled={isProcessing} variant="outline">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Heart className="mr-2 h-4 w-4" />
        )}
        {isProcessing ? 'Processing...' : `${buttonText} (Stripe)`}
      </Button>
    );
  }

  return null; 
} 