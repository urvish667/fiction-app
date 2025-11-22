"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WifiOff, Wifi } from "lucide-react"

/**
 * Offline Detection Banner
 * Shows a banner when the user loses internet connection
 */
export function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(true)
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        // Set initial online status
        setIsOnline(navigator.onLine)

        const handleOnline = () => {
            setIsOnline(true)
            // Show "Back online" message briefly
            setShowBanner(true)
            setTimeout(() => setShowBanner(false), 3000)
        }

        const handleOffline = () => {
            setIsOnline(false)
            setShowBanner(true)
        }

        // Listen for online/offline events
        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`fixed top-0 left-0 right-0 z-50 ${isOnline
                            ? "bg-green-500 text-white"
                            : "bg-destructive text-destructive-foreground"
                        }`}
                >
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                            {isOnline ? (
                                <>
                                    <Wifi className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        You're back online!
                                    </span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        No internet connection. Some features may not work.
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
