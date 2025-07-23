// components/AdSlot.tsx
"use client"

import React, { useLayoutEffect, useRef, useState } from "react"
import {
  AdsterraBannerConfig,
  NATIVE_CONTAINER_ID,
  NATIVE_SCRIPT_SRC,
  SOCIAL_BAR_SRC,
} from "@/lib/adsterra-config"

type PageType = "story" | "chapter" | "browse" | "home" | "other"
type AdType = "banner" | "native" | "social-bar"

interface AdSlotProps {
  id: string
  page: PageType
  adType: AdType
  className?: string
}

export const AdSlot: React.FC<AdSlotProps> = ({ id, page, adType, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Responsive detection
  useLayoutEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Determine the banner key based on page and screen size
  const getBannerKey = () => {
    if (isMobile) {
      if (["story", "chapter", "browse", "other"].includes(page)) {
        return "300x250"
      }
      return "320x50"
    }
    if (["story", "browse", "other"].includes(page)) {
      return "728x90"
    }
    return "320x50"
  }

  // Main insertion logic for each ad type
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Cleanup previous children
    const clearEl = () => {
      while (el.firstChild) el.removeChild(el.firstChild)
    }

    // Cleanup functions stack
    const cleanupFns: (() => void)[] = []

    if (adType === "native") {
      // Native Ad insertion
      clearEl()
      const nativeDiv = document.createElement("div")
      nativeDiv.id = NATIVE_CONTAINER_ID
      el.appendChild(nativeDiv)
      const nativeScript = document.createElement("script")
      nativeScript.src = NATIVE_SCRIPT_SRC
      nativeScript.async = true
      nativeScript.setAttribute("data-cfasync", "false")
      el.appendChild(nativeScript)

      cleanupFns.push(clearEl)

    } else if (adType === "social-bar") {
      // Social Bar insertion
      clearEl()
      const socialScript = document.createElement("script")
      socialScript.src = SOCIAL_BAR_SRC
      socialScript.async = true
      socialScript.id = "adsterra-social-bar"
      document.body.appendChild(socialScript)

      cleanupFns.push(() => {
        socialScript.remove()
        document.querySelectorAll("[class*=social_bar]").forEach(e => e.remove())
      })

    } else if (adType === "banner") {
      // Banner via sandboxed iframe
      clearEl()
      const { key, width, height } = AdsterraBannerConfig[getBannerKey()]
      const iframe = document.createElement("iframe")
      // Point to your hosted ad loader
      iframe.src = `https://ads.fablespace.space/adsterra-ads.html?type=banner&key=${key}&width=${width}&height=${height}`
      iframe.width = `${width}`
      iframe.height = `${height}`
      iframe.loading = "lazy"
      iframe.title = "Advertisement"
      iframe.referrerPolicy = "no-referrer-when-downgrade"
      iframe.sandbox.add(
        "allow-scripts",
        "allow-same-origin",
        "allow-popups",
        "allow-popups-to-escape-sandbox"
      )
      iframe.style.border = "none"
      iframe.style.overflow = "hidden"
      el.appendChild(iframe)

      cleanupFns.push(clearEl)
    }

    return () => {
      cleanupFns.forEach(fn => fn())
    }
  }, [adType, page, isMobile])

  // Determine container size for styling
  const { width, height } =
    adType === "banner"
      ? AdsterraBannerConfig[getBannerKey()]
      : { width: 300, height: 250 }

  return (
    <div
      ref={containerRef}
      id={id}
      className={`ad-slot ${className || ""}`}
      style={{ width, height, margin: "0 auto" }}
      role="complementary"
      aria-label="Advertisement"
    />
  )
}
