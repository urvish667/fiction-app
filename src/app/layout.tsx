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
  description: "FableSpace is a creative fiction-sharing platform where writers publish original stories and readers explore immersive worlds. From fantasy epics to romantic tales, discover, write, and connect with a passionate storytelling community.",
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
          <meta
            name="google-adsense-account"
            content={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
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
