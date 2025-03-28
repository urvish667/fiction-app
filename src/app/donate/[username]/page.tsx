"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Heart, Users, DollarSign, AlertCircle } from "lucide-react"
import Navbar from "@/components/navbar"

// Mock writer data
const mockWriters = {
  emmarivers: {
    id: "writer_1",
    name: "Emma Rivers",
    username: "emmarivers",
    avatar: "/placeholder-user.jpg",
    bio: "Fantasy writer creating worlds of magic and adventure. Thanks for your support!",
    followers: 1243,
    stories: 12,
    totalReads: 45600,
    totalLikes: 8900,
  },
  jameschen: {
    id: "writer_2",
    name: "James Chen",
    username: "jameschen",
    avatar: "/placeholder-user.jpg",
    bio: "Sci-fi enthusiast exploring the boundaries of technology and humanity.",
    followers: 876,
    stories: 8,
    totalReads: 32400,
    totalLikes: 6500,
  },
}

// Predefined donation amounts
const donationAmounts = [
  { value: "5", label: "$5" },
  { value: "10", label: "$10" },
  { value: "20", label: "$20" },
  { value: "50", label: "$50" },
]

export default function DonatePage() {
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string

  const [writer, setWriter] = useState<(typeof mockWriters)[keyof typeof mockWriters] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [donationAmount, setDonationAmount] = useState("10")
  const [customAmount, setCustomAmount] = useState("")
  const [message, setMessage] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")

  // Fetch writer data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const writerData = mockWriters[username as keyof typeof mockWriters]
      if (writerData) {
        setWriter(writerData)
      }
      setIsLoading(false)
    }, 500)
  }, [username])

  // Handle custom amount change
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Only allow numbers and decimal point
    if (!/^\d*\.?\d{0,2}$/.test(value) && value !== "") {
      return
    }

    // Set custom amount and select "custom" option
    setCustomAmount(value)
    if (value) {
      setDonationAmount("custom")
    } else {
      setDonationAmount("10") // Default back to $10 if custom is cleared
    }
  }

  // Handle donation submission
  const handleDonate = () => {
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

    // Simulate payment processing
    setTimeout(() => {
      // 90% success rate for demo purposes
      const isSuccess = Math.random() < 0.9

      if (isSuccess) {
        // Store donation details in session storage for the success page
        sessionStorage.setItem(
          "donation",
          JSON.stringify({
            writer: writer?.name,
            amount: amount,
            message: message,
          }),
        )

        router.push("/donate/success")
      } else {
        router.push("/donate/failed")
      }
    }, 1500)
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
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Writer Not Found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find a writer with the username "{username}".</p>
          <Button asChild>
            <Link href="/browse">Browse Writers</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl md:text-3xl">Support {writer.name}</CardTitle>
                <CardDescription>Your donation helps this writer create more amazing stories</CardDescription>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Writer Profile */}
                <div className="flex flex-col items-center">
                  <Link href={`/user/${writer.username}`} className="group">
                    <Avatar className="h-24 w-24 mb-3 group-hover:ring-2 ring-primary transition-all">
                      <AvatarImage src={writer.avatar} alt={writer.name} />
                      <AvatarFallback>{writer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-medium text-center group-hover:text-primary transition-colors">
                      {writer.name}
                    </h3>
                  </Link>

                  <p className="text-sm text-muted-foreground text-center mt-2 max-w-md">{writer.bio}</p>

                  <div className="flex gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{writer.followers.toLocaleString()} Followers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{writer.stories} Stories</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span>{writer.totalLikes.toLocaleString()} Likes</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Donation Amount */}
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

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="custom" id="amount-custom" className="peer sr-only" />
                        <Label htmlFor="amount-custom" className="flex-shrink-0 font-medium">
                          Custom Amount:
                        </Label>
                      </div>
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          value={customAmount}
                          onChange={handleCustomAmountChange}
                          placeholder="Enter amount"
                          className="pl-8"
                          onClick={() => {
                            if (customAmount) {
                              setDonationAmount("custom")
                            }
                          }}
                        />
                      </div>
                    </div>
                  </RadioGroup>

                  {error && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment Method</h3>

                  <Tabs defaultValue="card" value={paymentMethod} onValueChange={setPaymentMethod}>
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="card">Credit Card</TabsTrigger>
                      <TabsTrigger value="paypal">PayPal</TabsTrigger>
                      <TabsTrigger value="wallet">Google/Apple Pay</TabsTrigger>
                    </TabsList>

                    <TabsContent value="card" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardName">Name on Card</Label>
                          <Input id="cardName" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input id="cvc" placeholder="123" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="paypal" className="mt-4">
                      <div className="bg-muted/30 rounded-lg p-6 text-center">
                        <p className="mb-4">You'll be redirected to PayPal to complete your donation.</p>
                        <Image
                          src="/placeholder.svg?height=60&width=200"
                          alt="PayPal"
                          width={200}
                          height={60}
                          className="mx-auto"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="wallet" className="mt-4">
                      <div className="bg-muted/30 rounded-lg p-6 text-center">
                        <p className="mb-4">Choose your preferred digital wallet:</p>
                        <div className="flex justify-center gap-4">
                          <Button variant="outline" className="h-12 px-6">
                            <Image
                              src="/placeholder.svg?height=24&width=24"
                              alt="Google Pay"
                              width={24}
                              height={24}
                              className="mr-2"
                            />
                            Google Pay
                          </Button>
                          <Button variant="outline" className="h-12 px-6">
                            <Image
                              src="/placeholder.svg?height=24&width=24"
                              alt="Apple Pay"
                              width={24}
                              height={24}
                              className="mr-2"
                            />
                            Apple Pay
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <Separator />

                {/* Personal Message */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Leave a Message (Optional)</h3>
                    <span className="text-xs text-muted-foreground">{message.length}/250 characters</span>
                  </div>

                  <Textarea
                    placeholder="Leave a kind message for the writer..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 250))}
                    rows={4}
                  />

                  <p className="text-sm text-muted-foreground">
                    Your message will be visible to the writer and may be displayed on their profile.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  className="w-full h-12 text-lg bg-[#FF6B6B] hover:bg-[#FF5252]"
                  onClick={handleDonate}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>Donate {donationAmount === "custom" ? `$${customAmount}` : `$${donationAmount}`}</>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By donating, you agree to our{" "}
                  <Link href="#" className="underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

