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
  authorUsername?: string;
  storyId?: string;
  storyTitle?: string;
}

export function SupportButton({
  authorId,
  donationMethod,
  donationLink,
  authorName,
  authorUsername,
  storyId,
  storyTitle
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
      // Fixed amount for now - $5
      const amountInCents = 500;

      // Instead of processing the payment here, redirect to the donation page
      // The donation page will use our UnifiedPaymentForm component
      // Use username for the URL if available, otherwise use ID
      const userIdentifier = authorUsername || authorId;

      // Build the URL with query parameters
      let donationUrl = `/donate/${userIdentifier}?amount=${amountInCents}`;

      // Add story information if available
      if (storyId) {
        donationUrl += `&storyId=${storyId}`;
        if (storyTitle) {
          donationUrl += `&storyTitle=${encodeURIComponent(storyTitle)}`;
        }
      }

      router.push(donationUrl);
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