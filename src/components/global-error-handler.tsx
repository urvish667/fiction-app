"use client"

import { useEffect } from "react"
import { logError } from "@/lib/error-logger"
import { useToast } from "@/hooks/use-toast"

/**
 * Global Error Handler
 * Catches unhandled promise rejections and other global errors
 */
export function GlobalErrorHandler() {
    const { toast } = useToast()

    useEffect(() => {
        // Handle unhandled promise rejections
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            event.preventDefault()

            logError(event.reason, {
                context: "Unhandled Promise Rejection",
                action: "globalErrorHandler"
            })

            // Show user-friendly error toast for critical errors
            // Only show toast for errors that aren't already handled
            if (event.reason?.message && !event.reason?.handled) {
                toast({
                    title: "Something went wrong",
                    description: "An unexpected error occurred. Please try again.",
                    variant: "destructive"
                })
            }
        }

        // Handle global errors
        const handleError = (event: ErrorEvent) => {
            event.preventDefault()

            logError(event.error || event.message, {
                context: "Global Error",
                action: "globalErrorHandler",
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            })

            // Don't show toast for every error - only critical ones
            // Most errors should be handled by error boundaries
        }

        window.addEventListener("unhandledrejection", handleUnhandledRejection)
        window.addEventListener("error", handleError)

        return () => {
            window.removeEventListener("unhandledrejection", handleUnhandledRejection)
            window.removeEventListener("error", handleError)
        }
    }, [toast])

    // This component doesn't render anything
    return null
}
