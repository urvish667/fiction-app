"use client"

import React from "react"
import Link from "next/link"

export interface SiteFooterProps {
  // You can add props here if needed in the future
}

// Social Media Icon Components with proper brand colors
const YouTubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      fill="#FF0000"
    />
  </svg>
)

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <defs>
      <radialGradient id="instagram-gradient" cx="0.5" cy="1" r="1">
        <stop offset="0%" stopColor="#FDF497" />
        <stop offset="5%" stopColor="#FDF497" />
        <stop offset="45%" stopColor="#FD5949" />
        <stop offset="60%" stopColor="#D6249F" />
        <stop offset="90%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <path
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
      fill="url(#instagram-gradient)"
    />
  </svg>
)

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="#000000"
    />
  </svg>
)

const RedditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
      fill="#FF4500"
    />
  </svg>
)

const LemmyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.5 8.778c0 .394-.32.714-.714.714s-.714-.32-.714-.714c0-.394.32-.714.714-.714s.714.32.714.714zM12 19.5c-4.142 0-7.5-3.358-7.5-7.5S7.858 4.5 12 4.5s7.5 3.358 7.5 7.5-3.358 7.5-7.5 7.5zm-6.5-10.722c0 .394-.32.714-.714.714s-.714-.32-.714-.714c0-.394.32-.714.714-.714s.714.32.714.714z"
      fill="#00D69F"
    />
    <circle cx="8.5" cy="8.778" r="0.714" fill="#FFFFFF" />
    <circle cx="15.5" cy="8.778" r="0.714" fill="#FFFFFF" />
    <path d="M8 14c0.5 1 2 2 4 2s3.5-1 4-2" stroke="#FFFFFF" strokeWidth="1" fill="none" strokeLinecap="round" />
  </svg>
)

const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
      fill="#5865F2"
    />
  </svg>
)

export function SiteFooter() {
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
                <li>
                  <Link href="/content" className="text-muted-foreground hover:text-foreground">
                    Content & Monetization Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Follow us:</span>
              <div className="flex space-x-3">
                <Link
                  href="https://www.youtube.com/@fablespace-f9q?sub_confirmation=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-background hover:bg-accent transition-colors hover:scale-110 transform duration-200"
                  aria-label="YouTube"
                >
                  <YouTubeIcon />
                </Link>
                <Link
                  href="https://www.instagram.com/fable.space_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-background hover:bg-accent transition-colors hover:scale-110 transform duration-200"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </Link>
                <Link
                  href="https://x.com/intent/user?screen_name=FableSpace_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-background hover:bg-accent transition-colors hover:scale-110 transform duration-200"
                  aria-label="X (Twitter)"
                >
                  <XIcon />
                </Link>
                <Link
                  href="https://www.reddit.com/r/FableSpaceCommunity/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-background hover:bg-accent transition-colors hover:scale-110 transform duration-200"
                  aria-label="Reddit"
                >
                  <RedditIcon />
                </Link>
                <Link
                  href="https://lemmy.world/c/fablespace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-background hover:bg-accent transition-colors hover:scale-110 transform duration-200"
                  aria-label="Lemmy"
                >
                  <LemmyIcon />
                </Link>
                <Link
                  href="https://discord.gg/JVMr2TRXY7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-background hover:bg-accent transition-colors hover:scale-110 transform duration-200"
                  aria-label="Discord"
                >
                  <DiscordIcon />
                </Link>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} FableSpace. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
