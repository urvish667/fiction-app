"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { Navbar, SiteFooter } from "@/components/layout"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LegalPageLayoutProps {
  title: string
  lastUpdated: string
  children: ReactNode
  maxHeight?: string
}

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
  maxHeight = "h-[600px]",
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto py-12 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-6">{title}</h1>
            <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

            <div className="bg-card rounded-lg shadow-sm p-6 md:p-8">
              <ScrollArea className={`${maxHeight} pr-4`}>
                <div className="space-y-8">
                  {children}
                </div>
              </ScrollArea>
            </div>
          </div>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  )
}

export default LegalPageLayout
