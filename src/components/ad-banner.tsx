"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

interface AdBannerProps {
  type: "banner" | "interstitial" | "sidebar"
  className?: string
  slot?: string
  width?: number
  height?: number
}

export default function AdBanner({ type, className = "", slot, width, height }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' &&
        typeof window !== 'undefined' &&
        window.adsbygoogle &&
        adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (error) {
        console.error('AdSense error:', error)
      }
    }
  }, [])

  if (process.env.NODE_ENV !== 'production' || !slot) {
    return (
      <div
        className={`bg-muted/30 border border-dashed border-muted-foreground/20 rounded flex items-center justify-center min-h-[90px] ${className}`}
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

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
          maxWidth: width ? `${width}px` : "720px",
          height: height ? `${height}px` : "90px"
        }}
        data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}