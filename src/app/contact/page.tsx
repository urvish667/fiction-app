"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Message received",
        description: "Thanks for reaching out! We'll get back to you soon.",
      })
      
      // Reset form
      const form = e.target as HTMLFormElement
      form.reset()
    }, 1500)
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="mb-8 flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Mail className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-center mb-6">Contact Us</h1>
          <p className="text-center text-muted-foreground mb-8">
            Have questions, suggestions, or feedback? We'd love to hear from you!
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6 bg-muted/30 rounded-lg p-8">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input id="name" name="name" required />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input id="email" name="email" type="email" required />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input id="subject" name="subject" required />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea id="message" name="message" rows={5} required />
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2">Sending</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              For urgent inquiries, please email us directly at{" "}
              <a href="mailto:contact@fablespace.com" className="text-primary hover:underline">
                contact@fablespace.com
              </a>
            </p>
          </div>
        </motion.div>
      </main>
      
      <SiteFooter />
    </div>
  )
}
