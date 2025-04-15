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
}

export default function DonationSuccessPage() {
  const router = useRouter()
  const [donation, setDonation] = useState<DonationDetails | null>(null)

  useEffect(() => {
    // Get donation details from session storage
    const donationData = sessionStorage.getItem("donation")
    if (donationData) {
      setDonation(JSON.parse(donationData))
      // Clear the donation data
      sessionStorage.removeItem("donation")
    }
  }, [])

  if (!donation) {
    // If no donation details found, redirect to home
    router.push("/")
    return null
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
              <div className="text-center space-y-2">
                <p className="text-lg">
                  You have donated{" "}
                  <span className="font-bold text-primary">${donation.amount}</span> to{" "}
                  <span className="font-bold">{donation.writer}</span>
                </p>
                {donation.message && (
                  <p className="text-muted-foreground">
                    Your message: "{donation.message}"
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={() => router.push("/")} variant="default">
                  Return Home
                </Button>
                <Button onClick={() => router.back()} variant="outline">
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

