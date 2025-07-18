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

  // Get correct banner size
  const getBannerKey = () => {
    if (page === "story") return isMobile ? "320x50" : "728x90"
    if (page === "chapter") return isMobile ? "320x50" : "300x250"
    if (page === "browse") return "300x250"
    if (page === "home") return "728x90"
    return "300x250"
  }

  // Main insertion logic
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const cleanup: (() => void)[] = []

    // Native Ad
    if (adType === "native") {
      const nativeScript = document.createElement("script")
      nativeScript.src = NATIVE_SCRIPT_SRC
      nativeScript.async = true
      nativeScript.setAttribute("data-cfasync", "false")
      el.innerHTML = `<div id="${NATIVE_CONTAINER_ID}"></div>`
      el.appendChild(nativeScript)
      cleanup.push(() => {
        el.innerHTML = ""
      })
    }

    // Social Bar
    else if (adType === "social-bar") {
      const socialScript = document.createElement("script")
      socialScript.src = SOCIAL_BAR_SRC
      socialScript.async = true
      socialScript.id = "adsterra-social-bar"
      document.body.appendChild(socialScript)
      cleanup.push(() => {
        socialScript.remove()
        const overlays = document.querySelectorAll("[class*=social_bar]")
        overlays.forEach((el) => el.remove())
      })
    }

    // Banner
    else if (adType === "banner") {
      const key = AdsterraBannerConfig[getBannerKey()].key
      const { width, height } = AdsterraBannerConfig[getBannerKey()]

      const inlineConfig = document.createElement("script")
      inlineConfig.innerHTML = `
        atOptions = {
          'key': '${key}',
          'format': 'iframe',
          'height': ${height},
          'width': ${width},
          'params': {}
        };
      `
      const bannerScript = document.createElement("script")
      bannerScript.src = `//www.highperformanceformat.com/${key}/invoke.js`
      bannerScript.async = true
      bannerScript.id = `banner-${key}`

      el.innerHTML = ""
      el.appendChild(inlineConfig)
      el.appendChild(bannerScript)
      cleanup.push(() => {
        el.innerHTML = ""
      })
    }

    return () => {
      cleanup.forEach((fn) => fn())
    }
  }, [adType, page, isMobile])

  // Size (optional for styling)
  const { width, height } =
    adType === "banner" ? AdsterraBannerConfig[getBannerKey()] : { width: 300, height: 250 }

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
