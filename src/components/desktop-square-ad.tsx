// components/DesktopBottomAd.tsx
'use client'

import { useMediaQuery } from "@/hooks/use-media-query";
import AdBanner from "./ad-banner";

export function DesktopSqaureAd() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  if (!isDesktop) { 
    return (
      <div className="bg-muted/30 border border-dashed border-muted-foreground/20 rounded flex items-center justify-center">
        <div className="w-full flex justify-center items-start gap-8 py-4">
          <AdBanner type="interstitial" className="w-[300px] h-[250px]" slot="6596765108" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 border border-dashed border-muted-foreground/20 rounded flex items-center justify-center">
      <div className="w-full flex justify-center items-start gap-8 py-4">
        <AdBanner type="interstitial" className="w-[300px] h-[250px]" slot="6596765108" />
        <AdBanner type="interstitial" className="w-[300px] h-[250px]" slot="6596765108" />
      </div>
    </div>
  )
}
