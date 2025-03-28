"use client"

import { useEffect, useRef } from "react"

interface AdBannerProps {
  type: "banner" | "interstitial" | "sidebar"
  className?: string
}

export default function AdBanner({ type, className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // In a real implementation, this would initialize Google Ads
    // For example:
    // if (window.adsbygoogle && adRef.current) {
    //   (window.adsbygoogle = window.adsbygoogle || []).push({})
    // }
    // For demo purposes, we're just showing a placeholder
  }, [])

  return (
    <div
      ref={adRef}
      className={`bg-muted/30 border border-dashed border-muted-foreground/20 rounded flex items-center justify-center ${className}`}
    >
      <div className="text-center text-muted-foreground">
        <p className="text-sm font-medium">Advertisement</p>
        <p className="text-xs">
          {type === "banner" && "Banner Ad"}
          {type === "interstitial" && "Interstitial Ad"}
          {type === "sidebar" && "Sidebar Ad"}
        </p>
      </div>
    </div>
  )
}

