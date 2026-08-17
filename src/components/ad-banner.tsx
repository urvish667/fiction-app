"use client"

import { useEffect, useRef, useState } from "react"

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
  const containerRef = useRef<HTMLDivElement>(null)
  const adRef = useRef<HTMLModElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const pushedRef = useRef(false)

  // Step 1: Detect when container is actually visible in DOM with width > 0
  // (Prevents rendering <ins> tags inside display:none or 0-width containers, which causes AdSense availableWidth=0 TagError)
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined" ||
      !slot ||
      pushedRef.current
    ) {
      return
    }

    const checkVisibility = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(containerRef.current)
        if (
          computedStyle.display !== "none" &&
          computedStyle.visibility !== "hidden" &&
          rect.width > 0
        ) {
          setIsVisible(true)
          return true
        }
      }
      return false
    }

    if (checkVisibility()) {
      return
    }

    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            setIsVisible(true)
            observer.disconnect()
            break
          }
        }
      })
      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }
  }, [slot])

  // Step 2: Once <ins> is mounted and has measured width, safely push ad
  useEffect(() => {
    if (!isVisible || pushedRef.current || !slot) {
      return
    }

    const pushAd = () => {
      if (pushedRef.current) return
      try {
        if (adRef.current && adRef.current.offsetWidth > 0) {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          pushedRef.current = true
        }
      } catch (error) {
        console.error("AdSense push error:", error)
      }
    }

    const rafId = requestAnimationFrame(() => {
      pushAd()
    })

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [isVisible, slot])

  if (process.env.NODE_ENV !== "production" || !slot) {
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

  const defaultHeight = type === "sidebar" ? 250 : 90
  const defaultMaxWidth = type === "sidebar" ? "300px" : "720px"

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      {isVisible && (
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{
            display: "block",
            width: "100%",
            maxWidth: width ? `${width}px` : defaultMaxWidth,
            height: height ? `${height}px` : `${defaultHeight}px`,
          }}
          data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  )
}