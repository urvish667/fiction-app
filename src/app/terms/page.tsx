"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function TermsPage() {
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
            <h1 className="text-4xl font-bold mb-6">Terms and Conditions</h1>
            <p className="text-muted-foreground mb-8">Last updated: 06/18/2025</p>
            <div className="bg-card rounded-lg shadow-sm p-6 md:p-8">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-8">
                  {/* Introduction */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                    <p className="mb-4">
                      Welcome to FableSpace ("we," "our," or "us"). FableSpace is a storytelling platform that empowers creativity and connects people through stories.
                    </p>
                    <p className="mb-4">
                      These Terms and Conditions govern your access to and use of the FableSpace website, services, and applications (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
                    </p>
                    <p className="mb-4">
                      For more details on how we handle your data, please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. Additionally, our <Link href="/content" className="text-primary hover:underline">Content & Monetization Policy</Link> outlines guidelines for content ownership, copyright, and platform monetization.
                    </p>
                  </section>

                  <Separator />

                  {/* Acceptance of Terms */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">2. Acceptance of Terms</h2>
                    <p className="mb-4">
                      By creating an account, accessing, or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
                    </p>
                    <p>
                      You must be at least 13 years old to use the Service. If you are under 18, you represent that you have your parent or guardian's permission to use the Service and they have read and agree to these Terms on your behalf.
                    </p>
                  </section>

                  <Separator />

                  {/* User Accounts */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Registration</h2>
                    <p className="mb-4">
                      To access certain features of the Service, you must register for an account. When you register, you agree to provide accurate, current, and complete information and to update this information to maintain its accuracy.
                    </p>
                    <p className="mb-4">
                      You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                    </p>
                    <p>
                      We reserve the right to disable any user account if, in our opinion, you have violated any provision of these Terms.
                    </p>
                  </section>

                  <Separator />

                  {/* Content Guidelines */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">4. Content Guidelines and Ownership</h2>
                    <p className="mb-4">
                      You retain ownership of all content you create, post, or share on FableSpace ("User Content"). By posting User Content, you grant us a non-exclusive, royalty-free, worldwide license to use, store, display, reproduce, modify, and distribute your User Content solely for the purpose of operating and improving the Service.
                    </p>
                    <p className="mb-4">
                      You are solely responsible for your User Content and the consequences of posting it. You represent and warrant that:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>You own or have the necessary rights to use and authorize us to use your User Content</li>
                      <li>Your User Content does not violate the rights of any third party, including copyright, trademark, privacy, or other personal or proprietary rights</li>
                      <li>Your User Content does not contain material that is unlawful, defamatory, or otherwise objectionable</li>
                    </ul>
                    <p className="mb-4">
                      We do not claim ownership of your User Content, but we need certain permissions to provide the Service.
                    </p>
                    <p>
                      FableSpace may, but has no obligation to, monitor or review User Content. We reserve the right to remove any User Content for any reason without notice.
                    </p>
                  </section>

                  <Separator />

                  {/* Mature Content */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">5. Mature Content</h2>
                    <p className="mb-4">
                      FableSpace allows authors to mark their stories as containing mature content. Stories
                      marked as mature may include adult themes, consensual romance, violence, or explicit
                      content.
                    </p>
                    <p className="mb-4">
                      However, to comply with legal requirements and keep the platform safe for everyone, the
                      following types of content are <strong>not allowed</strong>:
                    </p>
                    <ul className="list-disc list-inside mb-4">
                      <li>Sexual violence, rape, or non-consensual sexual activity</li>
                      <li>Sexual content involving minors (characters under 18, even in fictional form)</li>
                      <li>Incest or sexual relationships between close family members</li>
                      <li>Bestiality or sexual activity with non-human creatures</li>
                      <li>Pornographic content created primarily for arousal rather than storytelling</li>
                    </ul>
                    <p className="mb-4">
                      By accessing mature content, you confirm that you are of appropriate age to view such
                      content according to the laws of your jurisdiction.
                    </p>
                    <p>
                      Non-logged-in users will be required to acknowledge a mature content warning before
                      accessing such stories.
                    </p>
                  </section>

                  <Separator />

                  {/* Privacy and Data */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">6. Privacy and Data Usage</h2>
                    <p className="mb-4">
                      Our Privacy Policy explains how we collect, use, and protect your personal information. By using our Service, you agree to our collection and use of information in accordance with the Privacy Policy.
                    </p>
                    <p>
                      You can control certain privacy settings through your account preferences, including whether to display your email address and location on your public profile.
                    </p>
                  </section>

                  <Separator />

                  {/* Payment Terms */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">7. Payment Terms</h2>
                    <p className="mb-4">
                      FableSpace allows readers to support authors through direct payments via our unified payment gateway, which may include PayPal and Stripe.
                    </p>
                    <p className="mb-4">
                      When you make a payment to an author:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>You agree to provide accurate and complete payment information</li>
                      <li>You authorize us to charge your payment method for the amount you specify</li>
                      <li>You understand that payments go directly to the author, with FableSpace acting only as a facilitator</li>
                      <li>All payments are final and non-refundable unless required by law</li>
                    </ul>
                    <p>
                      Authors receiving payments are responsible for any applicable taxes on the income they receive.
                    </p>
                  </section>

                  <Separator />

                  {/* Prohibited Activities */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">8. Prohibited Activities</h2>
                    <p className="mb-4">
                      You agree not to engage in any of the following prohibited activities:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Violating any laws or regulations</li>
                      <li>Infringing on the intellectual property rights of others</li>
                      <li>Posting unauthorized commercial communications</li>
                      <li>Uploading viruses or malicious code</li>
                      <li>Attempting to access accounts or data belonging to others</li>
                      <li>Interfering with or disrupting the Service</li>
                      <li>Creating multiple accounts for deceptive purposes</li>
                      <li>Harassing, intimidating, or threatening other users</li>
                      <li>Using the Service for any illegal or unauthorized purpose</li>
                    </ul>
                    <p>
                      Violation of these prohibitions may result in termination of your account and potential legal action.
                    </p>
                  </section>

                  <Separator />

                  {/* Intellectual Property */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
                    <p className="mb-4">
                      The Service and its original content, features, and functionality are owned by FableSpace and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                    </p>
                    <p>
                      Our name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of FableSpace. You may not use these marks without our prior written permission.
                    </p>
                  </section>

                  <Separator />

                  {/* Limitation of Liability */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
                    <p className="mb-4">
                      To the maximum extent permitted by law, FableSpace and its officers, directors, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection with these Terms or your use of the Service.
                    </p>
                    <p>
                      In no event will our aggregate liability for any claims relating to these Terms or the Service exceed the greater of $100 or the amount you paid us, if any, in the past 12 months.
                    </p>
                  </section>

                  <Separator />

                  {/* Termination */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
                    <p className="mb-4">
                      We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.
                    </p>
                    <p>
                      Upon termination, your right to use the Service will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
                    </p>
                  </section>

                  <Separator />

                  {/* Changes to Terms */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
                    <p className="mb-4">
                      We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
                    </p>
                    <p>
                      By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.
                    </p>
                  </section>

                  <Separator />

                  {/* Contact Information */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
                    <p>
                      If you have any questions about these Terms, please contact us at support@fablespace.space.
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
