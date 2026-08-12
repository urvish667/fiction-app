import type React from "react"
import type { Metadata } from "next"
import { Inter, Cormorant_Garamond } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Providers from "./providers"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
import { Analytics } from "@/components/analytics"
import { OfflineBanner } from "@/components/offline-banner"
import { GlobalErrorHandler } from "@/components/global-error-handler"
import BottomNav from "@/components/bottom-nav"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  ),
  title: {
    default: "FableSpace - Unleash Your Stories",
    template: "%s | FableSpace",
  },
  description: "Unleash your imagination on FableSpace. Publish original stories, explore fantasy, romance, and more. Connect with readers and writers in a growing creative community—no fees, no limits.",
  openGraph: {
    siteName: "FableSpace",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FableSpace - Creative Fiction Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@FableSpace",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Head metadata and fonts */}
      </head>
      <body className={`${inter.variable} ${cormorant.variable} font-sans pb-16 md:pb-0`}>
        {/* Google AdSense Script */}
        {process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID && (
          <Script
            id="adsense-script"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
        <Analytics />
        <GlobalErrorHandler />
        <OfflineBanner />
        <Providers>
          <ThemeProvider>
            {children}
            <BottomNav />
          </ThemeProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
