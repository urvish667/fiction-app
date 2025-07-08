"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Navbar from "@/components/navbar"

interface DonationDetails {
  writer: string
  amount: string
  message?: string
  storyId?: string | null
  storyTitle?: string | null
  storySlug?: string | null
}

export default function DonationSuccessPage() {
  const router = useRouter()
  const [donation, setDonation] = useState<DonationDetails | null>(null)

  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Function to get donation details from session storage
    const getDonationDetails = () => {
      try {
        // Get donation details from session storage
        const donationData = window.sessionStorage.getItem("donation");

        if (donationData) {
          // Parse the donation data
          const parsedData = JSON.parse(donationData);

          // Set the donation state
          setDonation(parsedData);

          // Clear the donation data
          window.sessionStorage.removeItem("donation");
        } else {
          // If no donation details found, set flag to redirect
          setShouldRedirect(true);
        }
      } catch {
        setShouldRedirect(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure session storage is available
    const timer = setTimeout(() => {
      getDonationDetails();
    }, 300);

    return () => clearTimeout(timer);
  }, [])

  // Handle redirect in a separate effect
  useEffect(() => {
    if (shouldRedirect && !isLoading) {
      // Add a small delay before redirecting
      const timer = setTimeout(() => {
        router.push("/");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [shouldRedirect, isLoading, router]);

  // Fallback donation data in case session storage fails
  useEffect(() => {
    // If we're not loading and don't have donation data and aren't redirecting yet
    if (!isLoading && !donation && !shouldRedirect) {

      // Set a generic donation as fallback
      setDonation({
        writer: "the creator",
        amount: "some amount",
        message: "Thank you for your support!"
      });
    }
  }, [isLoading, donation, shouldRedirect]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (shouldRedirect || !donation) {
    return null; // Return null while redirecting
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto">
          <Card>

            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl md:text-3xl">Thank You!</CardTitle>
              <CardDescription>Your donation has been processed successfully</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
                <p className="text-lg">
                  You have donated{" "}
                  <span className="font-bold text-primary">${donation.amount}</span> to{" "}
                  <span className="font-bold">{donation.writer}</span>
                </p>
                {donation.storyTitle && (
                  <p className="text-muted-foreground">
                    For the story: <span className="font-semibold">{donation.storyTitle}</span>
                  </p>
                )}
                {donation.message && (
                  <p className="text-muted-foreground mt-2 italic">
                    Your message: &quot;{donation.message}&quot;
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  Your support helps creators continue to produce amazing content.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {donation.storyTitle ? (
                  <Button
                    onClick={() => router.push(donation.storySlug ? `/story/${donation.storySlug}` : `/`)}
                    variant="outline"
                    className="mb-2"
                  >
                    Return to Story
                  </Button>
                ) : null}
                <Button onClick={() => router.push("/")} variant="default">
                  Return Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

