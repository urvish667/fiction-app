import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Providers from "./providers"
import { Toaster } from "@/components/ui/toaster"
import SessionDebug from "@/components/debug/session-debug"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FableSpace - Unleash Your Stories",
  description: "A modern fiction-sharing platform where writers and readers connect",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ThemeProvider>
            {children}
            {process.env.NODE_ENV !== 'production' && <SessionDebug />}
          </ThemeProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
