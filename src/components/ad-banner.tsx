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

  const pushedRef = useRef(false)

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      typeof window === 'undefined' ||
      !slot ||
      pushedRef.current
    ) {
      return
    }

    const pushAd = () => {
      if (pushedRef.current) return
      try {
        if (adRef.current && adRef.current.offsetWidth > 0) {
          (window.adsbygoogle = window.adsbygoogle || []).push({})
          pushedRef.current = true
        }
      } catch (error) {
        console.error('AdSense error:', error)
      }
    }

    if (adRef.current && adRef.current.offsetWidth > 0) {
      pushAd()
    } else if (adRef.current && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && !pushedRef.current) {
            pushAd()
            observer.disconnect()
          }
        }
      })
      observer.observe(adRef.current)
      return () => {
        observer.disconnect()
      }
    }
  }, [slot])

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