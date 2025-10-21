"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ContentPolicyPage() {
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
            <h1 className="text-4xl font-bold mb-6">Content & Monetization Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: 10/21/2025</p>
            
            <div className="bg-card rounded-lg shadow-sm p-6 md:p-8">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-8">
                  {/* Purpose */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">1. Purpose</h2>
                    <p className="mb-4">
                      FableSpace is a community-driven fiction platform that celebrates creativity, storytelling, and fan communities. This policy explains how we handle copyright ownership, fanfiction content, and monetization (including ads and donations).
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Ownership of Content */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">2. Ownership of Content</h2>
                    <p className="mb-4">
                      Authors retain full rights to their <strong>original works</strong> published on FableSpace.
                    </p>
                    <p className="mb-4">
                      Fanfiction stories remain the property of their respective writers, but all underlying characters, worlds, and intellectual property belong to their <strong>original creators or license holders</strong> (e.g., anime studios, book publishers, etc.).
                    </p>
                    <p>
                      FableSpace <strong>does not claim ownership</strong> of any story content uploaded by users.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Use of Copyrighted Material */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">3. Use of Copyrighted Material</h2>
                    <p className="mb-4">
                      Fanfiction based on copyrighted works may be published under <strong>fair use / transformative use</strong> principles, where applicable.
                    </p>
                    <p className="mb-4">
                      If a rights holder believes a story infringes their IP, they may <strong>contact us</strong> at <code>support@fablespace.space</code> for review or removal.
                    </p>
                    <p>
                      We comply with all valid takedown requests under the <strong>Digital Millennium Copyright Act (DMCA)</strong> and similar laws.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Advertising and Monetization */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">4. Advertising and Monetization</h2>
                    <p className="mb-4">
                      Ads shown on FableSpace are used to <strong>support hosting, development, and maintenance</strong> of the platform.
                    </p>
                    <p className="mb-4">
                      We do <strong>not claim ownership</strong> of or directly monetize individual fanfics.
                    </p>
                    <p className="mb-4">
                      Advertising revenue is treated as a <strong>platform maintenance fee</strong>, similar to other user-generated platforms (e.g., YouTube, Wattpad).
                    </p>
                    <p>
                      Ads may appear across the website (e.g., homepage, discovery pages, and general reading interfaces). However, ads shown during the reading of fanfiction are <strong>not an endorsement</strong> or monetization of that specific story.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Donations and Support */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">5. Donations and Support</h2>
                    <p className="mb-4">
                      FableSpace currently <strong>does not accept or process donations</strong> directly through the platform.
                    </p>
                    <p className="mb-4">
                      Some users may choose to support authors personally through external platforms (such as <strong>Ko-fi</strong> or <strong>Buy Me a Coffee</strong>). These are <strong>user-to-user transactions</strong> and are <strong>not managed, tracked, or facilitated</strong> by FableSpace.
                    </p>
                    <p className="mb-4">
                      Fanfiction authors may receive donations as personal appreciation, <strong>not as payment for their stories</strong> or for any copyrighted material referenced in their work.
                    </p>
                    <p className="mb-4">
                      Original authors who publish their own works on FableSpace may share links to receive voluntary support for their writing.
                    </p>    
                    <p>
                      FableSpace holds no responsibility for transactions conducted outside the platform.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Content Removal and Disputes */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">6. Content Removal and Disputes</h2>
                    <p className="mb-4">
                      If a copyright holder contacts us about a potential infringement, we'll review and, if necessary, remove or restrict access to the content.
                    </p>
                    <p className="mb-4">
                      We'll notify the author when possible, giving them a chance to respond or revise their story.
                    </p>
                    <p>
                      Repeat copyright violations may lead to account suspension.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Questions or Reports */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">7. Questions or Reports</h2>
                    <p>
                      If you are a copyright holder or have questions about monetization or platform ads, please contact:
                    </p>
                    <p>
                      📩 <a href="mailto:support@fablespace.space">support@fablespace.space</a>
                    </p>
                  </section>
                </div>
              </ScrollArea>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Button asChild variant="outline">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
      
      <SiteFooter />
    </div>
  )
}