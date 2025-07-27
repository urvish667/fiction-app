"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  AdsterraBannerConfig,
  NATIVE_CONTAINER_ID,
  NATIVE_SCRIPT_SRC,
  SOCIAL_BAR_SRC,
  BannerKey
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
  const [adKey, setAdKey] = useState<BannerKey>("728x90")

  // Responsive detection using ResizeObserver for better reliability
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 640)
    }

    updateSize()

    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  useEffect(() => {
    const key = (() => {
      if (isMobile) {
        if (["story", "chapter", "browse", "other"].includes(page)) return "300x250"
        return "320x50"
      } else {
        if (["story", "browse", "other"].includes(page)) return "728x90"
        return "320x50"
      }
    })()
    setAdKey(key)
  }, [isMobile, page])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const clearEl = () => {
      while (el.firstChild) el.removeChild(el.firstChild)
    }

    const cleanupFns: (() => void)[] = []

    if (adType === "native") {
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
      clearEl()
      const { key, width, height } = AdsterraBannerConfig[adKey]
      const iframe = document.createElement("iframe")
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
      iframe.style.display = "block"
      iframe.style.margin = "0 auto"

      el.appendChild(iframe)

      cleanupFns.push(clearEl)
    }

    return () => {
      cleanupFns.forEach(fn => fn())
    }
  }, [adType, adKey]) // Depend on adKey instead of isMobile/page

  const { width, height } =
    adType === "banner"
      ? AdsterraBannerConfig[adKey]
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
