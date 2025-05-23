"use client"

import { useEffect, useRef } from "react"

// Declare global adsbygoogle for TypeScript
declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

interface AdBannerProps {
  type: "banner" | "interstitial" | "sidebar"
  className?: string
  slot?: string // AdSense ad slot ID
}

export default function AdBanner({ type, className = "", slot }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    // Only initialize ads in production and if AdSense is loaded
    if (process.env.NODE_ENV === 'production' &&
        typeof window !== 'undefined' &&
        window.adsbygoogle &&
        adRef.current) {
      try {
        // Push the ad to AdSense queue
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (error) {
        console.error('AdSense error:', error)
      }
    }
  }, [])

  // In development or if no slot is provided, show placeholder
  if (process.env.NODE_ENV !== 'production' || !slot) {
    return (
      <div
        className={`bg-muted/30 border border-dashed border-muted-foreground/20 rounded flex items-center justify-center ${className}`}
      >
        <div className="text-center text-muted-foreground">
          <p className="text-sm font-medium">Advertisement</p>
          <p className="text-xs opacity-70">
            {type === "banner" && "Banner Ad"}
            {type === "interstitial" && "Interstitial Ad"}
            {type === "sidebar" && "Sidebar Ad"}
          </p>
        </div>
      </div>
    )
  }

  // Production AdSense ad
  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}

