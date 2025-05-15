"use client"

import { motion } from "framer-motion"
import { CalendarClock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"

export default function ChallengesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="mb-8 flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <CalendarClock className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-6">Writing Challenges</h1>
          
          <div className="bg-muted/30 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Coming Soon...</h2>
            <p className="text-lg text-muted-foreground mb-6">
              We're working on exciting writing challenges to help you improve your skills, 
              connect with other writers, and unleash your creativity.
            </p>
            <p className="text-muted-foreground mb-8">
              Check back soon for weekly prompts, themed contests, and community challenges!
            </p>
            
            <div className="flex justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/">Return Home</Link>
              </Button>
              <Button asChild>
                <Link href="/browse">Browse Stories</Link>
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Have ideas for challenges you'd like to see? 
            <Link href="/contact" className="text-primary hover:underline ml-1">
              Let us know!
            </Link>
          </div>
        </motion.div>
      </main>
      
      <SiteFooter />
    </div>
  )
}
