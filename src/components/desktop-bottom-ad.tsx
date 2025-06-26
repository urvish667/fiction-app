// components/DesktopBottomAd.tsx
'use client'

import { useMediaQuery } from "@/hooks/use-media-query";
import AdBanner from "./ad-banner";
import { Link } from "lucide-react";

export function DesktopBottomAd() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  if (!isDesktop) return null

  return (
    <div className="sticky bottom-0 w-full z-40 px-4 py-2">
        <div className="bg-muted/30 border border-dashed border-muted-foreground/20 rounded flex items-center justify-center">
            {/* "Why ads" button */}
            <a
              href="/about#faq"
              className="absolute top-1 right-2 text-xs text-muted-foreground underline hover:text-primary transition"
            >
              why ads?
            </a>
            <AdBanner
                type="banner"
                className="w-full max-w-[720px] h-[90px] mx-auto"
                slot="6596765108"
            />
        </div>
    </div>
  )
}
