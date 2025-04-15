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
import { StripePaymentForm } from "@/components/payments/StripePaymentForm"
import { PayPalPaymentForm } from "@/components/payments/PayPalPaymentForm"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

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
  const paymentIntent = searchParams?.get('payment_intent') || null

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
  }, [params?.username, toast])

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value)
      setDonationAmount("custom")
    }
  }

  const handleDonate = async () => {
    try {
      // Validate amount
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

      // Create payment intent
      const response = await fetch('/api/donations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: writer?.id,
          amount: Math.round(amount * 100), // Convert to cents
          message: message,
          paymentMethod: writer?.donationMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create donation')
      }

      if (data.paypalLink) {
        // Redirect to PayPal
        window.location.href = data.paypalLink
      } else if (data.clientSecret) {
        // Handle Stripe payment
        setClientSecret(data.clientSecret)
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

    // Store donation details for the success page
    sessionStorage.setItem(
      "donation",
      JSON.stringify({
        writer: writer.name,
        amount: donationAmount === "custom" ? customAmount : donationAmount,
        message: message,
      })
    )

    router.push("/donate/success")
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
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
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

