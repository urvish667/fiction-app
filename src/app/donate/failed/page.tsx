"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, HelpCircle } from "lucide-react"
import Navbar from "@/components/navbar"

export default function DonationFailedPage() {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)

  // Handle retry
  const handleRetry = () => {
    setIsRetrying(true)

    // Simulate processing
    setTimeout(() => {
      // Go back to previous page
      router.back()
    }, 1000)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="border-2 border-destructive/50">
              <CardHeader className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="mx-auto bg-destructive/10 rounded-full p-4 mb-4"
                >
                  <AlertCircle className="h-12 w-12 text-destructive" />
                </motion.div>

                <CardTitle className="text-2xl md:text-3xl">Payment Failed</CardTitle>
                <CardDescription className="text-lg">Oops! Something went wrong with your donation.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-sm">Your payment could not be processed. This could be due to:</p>
                  <ul className="text-sm text-muted-foreground mt-2 text-left list-disc pl-5 space-y-1">
                    <li>Insufficient funds</li>
                    <li>Incorrect payment details</li>
                    <li>Temporary issue with the payment provider</li>
                    <li>Connection issues</li>
                  </ul>
                </div>

                <div className="flex items-start gap-3 bg-primary/5 rounded-lg p-4">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Need help?</p>
                    <p className="text-sm text-muted-foreground">
                      If you continue to experience issues, please contact our support team.
                    </p>
                    <Button variant="link" className="p-0 h-auto text-sm mt-1">
                      Contact Support
                    </Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full" onClick={handleRetry} disabled={isRetrying}>
                  {isRetrying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Retrying...
                    </>
                  ) : (
                    "Try Again"
                  )}
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Home
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

