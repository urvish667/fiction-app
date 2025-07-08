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
import { fetchWithCsrf } from "@/lib/client/csrf"

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const contactData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    }

    try {
      const response = await fetchWithCsrf('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      })

      if (response.ok) {
        toast({
          title: "Message sent successfully!",
          description: "Thanks for reaching out! We'll get back to you soon.",
        })
        form.reset()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
            Have questions, suggestions, or feedback? We&apos;d love to hear from you!
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
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  )
}
