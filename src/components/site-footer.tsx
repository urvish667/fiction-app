"use client"

import React from "react"
import Link from "next/link"

export interface SiteFooterProps {
  // You can add props here if needed in the future
}

export function SiteFooter(props: SiteFooterProps) {
  return (
    <footer className="py-10 px-4 md:px-8 bg-muted">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-bold font-serif">FableSpace</h2>
            <p className="text-muted-foreground">Unleash your stories, one page at a time.</p>
          </div>
          <div className="flex gap-8">
            <div>
              <h3 className="font-medium mb-2">Platform</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/browse" className="text-muted-foreground hover:text-foreground">
                    Browse
                  </Link>
                </li>
                <li>
                  <Link href="/write/story-info" className="text-muted-foreground hover:text-foreground">
                    Write
                  </Link>
                </li>
                <li>
                  <Link href="/challenges" className="text-muted-foreground hover:text-foreground">
                    Challenges
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Company</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Legal</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} FableSpace. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
