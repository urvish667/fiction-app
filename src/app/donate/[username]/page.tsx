"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Heart, Users, DollarSign, AlertCircle, Loader2 } from "lucide-react"
import Navbar from "@/components/navbar"
import { useToast } from "@/components/ui/use-toast"
import { UnifiedPaymentForm } from "@/components/payments/UnifiedPaymentForm"

// Predefined donation amounts
const donationAmounts = [
  { value: "5", label: "$5" },
  { value: "10", label: "$10" },
  { value: "20", label: "$20" },
  { value: "50", label: "$50" },
]

interface Writer {
  id: string
  name: string | null
  username: string
  image?: string | null
  bio?: string | null
  storyCount: number
  followers: number
  following: number
  donationsEnabled?: boolean | null
  donationMethod: 'stripe' | 'paypal' | null
  donationLink?: string | null
}

export default function DonatePage() {
  const params = useParams<{ username: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [writer, setWriter] = useState<Writer | null>(null)
  const [donationAmount, setDonationAmount] = useState("5")
  const [customAmount, setCustomAmount] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const urlClientSecret = searchParams?.get('clientSecret') || null
  const urlAmount = searchParams?.get('amount') || null

  useEffect(() => {
    const fetchWriter = async () => {
      if (!params?.username) {
        setError("Username is required");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/${params.username}`)
        if (!response.ok) {
          throw new Error('Writer not found')
        }
        const data = await response.json()
        setWriter(data)

        // If we have a client secret in the URL, set it in the state
        if (urlClientSecret) {
          setClientSecret(urlClientSecret)
        }

        // If we have an amount in the URL, set it in the state
        if (urlAmount) {
          const amountInDollars = (parseInt(urlAmount) / 100).toString()
          setDonationAmount(amountInDollars)
        }
      } catch (error) {
        console.error('Error fetching writer:', error)
        toast({
          title: "Error",
          description: "Could not load writer information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchWriter()
  }, [params?.username, toast, urlClientSecret, urlAmount])

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value)
      setDonationAmount("custom")
    }
  }

  /**
   * Handle donation submission using the unified payment gateway
   */
  const handleDonate = async () => {
    try {
      // 1. Validate amount
      const amount = donationAmount === "custom" ? Number.parseFloat(customAmount) : Number.parseFloat(donationAmount)

      if (isNaN(amount) || amount < 1) {
        setError("Please enter a valid donation amount (minimum $1)")
        return
      }

      if (amount > 500) {
        setError("Maximum donation amount is $500")
        return
      }

      setError("")
      setIsProcessing(true)

      // 2. Process payment through unified payment gateway
      const response = await fetch('/api/donations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: writer?.id,
          amount: Math.round(amount * 100), // Convert to cents
          message: message,
          // No need to specify payment method - the backend will determine it based on recipient settings
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create donation')
      }

      // 3. Handle response based on payment processor type
      if (data.processorType === 'stripe' && data.clientSecret) {
        // Handle Stripe payment
        setClientSecret(data.clientSecret)
      } else if (data.processorType === 'paypal') {
        // For PayPal, we'll use the UnifiedPaymentForm component
        // which will render the PayPalPaymentForm
        setClientSecret('paypal') // This is a hack to trigger the UnifiedPaymentForm
      } else {
        throw new Error('Invalid payment response')
      }

    } catch (error) {
      console.error('Donation error:', error)
      toast({
        title: "Donation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  // Handle successful payment
  const handlePaymentSuccess = () => {
    if (!writer) {
      toast({
        title: "Error",
        description: "Writer information not found",
        variant: "destructive",
      });
      return;
    }


    // Show a success message
    toast({
      title: "Payment Successful!",
      description: "Thank you for supporting " + (writer.name || writer.username),
      variant: "default",
    });

    // Prepare donation details
    const donationDetails = {
      writer: writer.name || writer.username,
      amount: donationAmount === "custom" ? customAmount : donationAmount,
      message: message,
    };

    // Store donation details for the success page - use try/catch to handle potential errors
    try {
      // First, clear any existing donation data
      window.sessionStorage.removeItem("donation");

      // Then set the new donation data
      window.sessionStorage.setItem(
        "donation",
        JSON.stringify(donationDetails)
      );
    } catch (error) {
      // Silent error handling - we'll use fallback on success page if needed
    }

    // Add a small delay before redirecting to ensure session storage is set
    setTimeout(() => {
      // Redirect to success page
      router.push("/donate/success");
    }, 500);
  }

  // Handle payment error
  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error)
    toast({
      title: "Payment Failed",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    })
    setIsProcessing(false)
    setClientSecret(null)
  }

  // If loading or writer not found
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!writer) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle>Writer Not Found</CardTitle>
              <CardDescription>The writer you're looking for could not be found.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/")}>Return Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2">
              <CardHeader>

                <CardTitle>Support {writer?.name || writer?.username}</CardTitle>
                <CardDescription>
                  Choose your donation amount. Your payment will be processed securely and sent directly to the creator.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Choose Donation Amount</h3>
                  <RadioGroup value={donationAmount} onValueChange={setDonationAmount} className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {donationAmounts.map((amount) => (
                        <div key={amount.value}>
                          <RadioGroupItem value={amount.value} id={`amount-${amount.value}`} className="peer sr-only" />
                          <Label
                            htmlFor={`amount-${amount.value}`}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <span className="text-xl font-bold">{amount.label}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  <div className="space-y-2">
                    <Label htmlFor="custom-amount">Custom Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        id="custom-amount"
                        type="text"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        placeholder="Enter amount"
                        className="pl-7"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a message to the creator"
                    className="min-h-[100px]"
                  />
                </div>

                {clientSecret ? (
                  <UnifiedPaymentForm
                    recipientId={writer.id}
                    amount={donationAmount === "custom" ? Math.round(Number.parseFloat(customAmount) * 100) : Math.round(Number.parseFloat(donationAmount) * 100)}
                    message={message}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onCancel={() => {
                      setClientSecret(null);
                      setIsProcessing(false);
                    }}
                  />
                ) : (
                  <div className="flex justify-end">
                    <Button onClick={handleDonate} disabled={isProcessing} size="lg">
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Heart className="mr-2 h-4 w-4" />
                          Support {writer.name}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

