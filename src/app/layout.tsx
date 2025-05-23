import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Providers from "./providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FableSpace - Unleash Your Stories",
  description: "A modern fiction-sharing platform where writers and readers connect",
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
