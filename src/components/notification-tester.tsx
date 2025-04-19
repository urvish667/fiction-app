"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

/**
 * A component for testing notifications in development
 * This should only be used in development mode
 */
export function NotificationTester() {
  const { toast } = useToast()
  const [type, setType] = useState("like")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [delay, setDelay] = useState(0)
  const [loading, setLoading] = useState(false)

  // Only show in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== "development") {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          title: title || undefined,
          message: message || undefined,
          delay: delay || 0,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create test notification: ${response.status}`)
      }

      const data = await response.json()
      toast({
        title: "Test Notification Sent",
        description: data.message,
      })

      // Reset form
      setTitle("")
      setMessage("")
    } catch (error) {
      console.error("Error creating test notification:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create test notification",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-muted/20">
      <h3 className="text-lg font-medium mb-4">Test Notification</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Type
            </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="like">Like</SelectItem>
                <SelectItem value="comment">Comment</SelectItem>
                <SelectItem value="follow">Follow</SelectItem>
                <SelectItem value="chapter">Chapter</SelectItem>
                <SelectItem value="donation">Donation</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="delay" className="text-sm font-medium">
              Delay (ms)
            </label>
            <Input
              id="delay"
              type="number"
              min="0"
              step="1000"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title (optional)
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Test ${type} Notification`}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium">
            Message (optional)
          </label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`This is a test ${type} notification`}
            rows={3}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Test Notification"}
        </Button>
      </form>
    </div>
  )
}
