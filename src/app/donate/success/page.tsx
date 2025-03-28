"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Confetti from "react-confetti"
import { useWindowSize } from "react-use"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Heart, Twitter, Facebook, Copy, Check, ArrowLeft } from "lucide-react"
import Navbar from "@/components/navbar"

export default function DonationSuccessPage() {
  const router = useRouter()
  const { width, height } = useWindowSize()
  const [donation, setDonation] = useState<{
    writer: string
    amount: number
    message?: string
  } | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)

  // Get donation details from session storage
  useEffect(() => {
    const donationData = sessionStorage.getItem("donation")
    if (donationData) {
      setDonation(JSON.parse(donationData))
    } else {
      // If no donation data, redirect to home
      router.push("/")
    }

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  // Handle copy share link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin)
    setLinkCopied(true)

    setTimeout(() => {
      setLinkCopied(false)
    }, 2000)
  }

  // Handle social sharing
  const handleShare = (platform: string) => {
    const text = `I just supported ${donation?.writer} on FableSpace with a donation of $${donation?.amount}! Check out their amazing stories.`
    const url = window.location.origin

    let shareUrl = ""

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        break
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank")
    }
  }

  if (!donation) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {showConfetti && <Confetti width={width} height={height} recycle={false} />}

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-2">
              <CardHeader className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="mx-auto bg-primary/10 rounded-full p-4 mb-4"
                >
                  <Heart className="h-12 w-12 text-[#FF6B6B]" />
                </motion.div>

                <CardTitle className="text-2xl md:text-3xl">Thank You!</CardTitle>
                <CardDescription className="text-lg">Your donation to {donation.writer} was successful</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Donation Amount</p>
                  <p className="text-3xl font-bold">${donation.amount.toFixed(2)}</p>
                </div>

                {donation.message && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Your message:</p>
                    <div className="bg-muted/30 rounded-lg p-4 italic text-sm">"{donation.message}"</div>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <p className="text-center font-medium">Share your support</p>

                  <div className="flex justify-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={() => handleShare("twitter")}
                    >
                      <Twitter className="h-5 w-5" />
                      <span className="sr-only">Share on Twitter</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={() => handleShare("facebook")}
                    >
                      <Facebook className="h-5 w-5" />
                      <span className="sr-only">Share on Facebook</span>
                    </Button>

                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={handleCopyLink}>
                      {linkCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                      <span className="sr-only">Copy link</span>
                    </Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full" asChild>
                  <Link href="/">Continue Reading</Link>
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/user/${donation.writer}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Visit {donation.writer}'s Profile
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

