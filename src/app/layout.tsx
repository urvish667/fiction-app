import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Providers from "./providers"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
import { Analytics } from "@/components/analytics"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  ),
  title: "FableSpace - Unleash Your Stories",
  icons: {
    icon: "/favicon.ico",
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense Account Verification Meta Tag */}
        {process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID && (
          <Script
            id="adsense-script"
            strategy="afterInteractive"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}

        {/* Google AdSense Script - Only included in production */}
        {process.env.NODE_ENV === 'production' && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={inter.className}>
        <Analytics />
        <Providers>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
