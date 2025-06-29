"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function PrivacyPolicyPage() {
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
            <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="bg-card rounded-lg shadow-sm p-6 md:p-8">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-8">
                  {/* Introduction */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                    <p className="mb-4">
                      Welcome to FableSpace. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
                    </p>
                    <p>
                      Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access or use our service.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Information We Collect */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                    <p className="mb-4">
                      We collect several types of information from and about users of our service, including:
                    </p>
                    <h3 className="text-lg font-medium mt-4 mb-2">Personal Data</h3>
                    <p className="mb-4">
                      When you register for an account, we collect:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Email address</li>
                      <li>Username</li>
                      <li>Password (stored in encrypted form)</li>
                      <li>Date of birth (to verify age requirements)</li>
                      <li>Pronouns (optional)</li>
                    </ul>
                    
                    <h3 className="text-lg font-medium mt-4 mb-2">Profile Information</h3>
                    <p className="mb-4">
                      You may choose to provide additional information in your profile such as:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Profile picture</li>
                      <li>Banner image</li>
                      <li>Biography</li>
                      <li>Location</li>
                      <li>Website</li>
                      <li>Social media links</li>
                    </ul>
                    
                    <h3 className="text-lg font-medium mt-4 mb-2">Content Data</h3>
                    <p className="mb-4">
                      We collect and store the content you create, upload, or share on our platform, including:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Stories and chapters</li>
                      <li>Comments</li>
                      <li>Likes and follows</li>
                      <li>Cover images</li>
                    </ul>
                    
                    <h3 className="text-lg font-medium mt-4 mb-2">Usage Data</h3>
                    <p className="mb-4">
                      We automatically collect certain information about how you interact with our service, including:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>IP address</li>
                      <li>Browser type and version</li>
                      <li>Device information</li>
                      <li>Pages visited and features used</li>
                      <li>Time and date of your visits</li>
                      <li>Referring website addresses</li>
                    </ul>
                  </section>
                  
                  <Separator />
                  
                  {/* How We Use Your Information */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                    <p className="mb-4">
                      We use the information we collect for various purposes, including:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>To provide and maintain our service</li>
                      <li>To create and manage your account</li>
                      <li>To enable you to share and interact with other users</li>
                      <li>To personalize your experience and deliver content relevant to your interests</li>
                      <li>To process payments and donations between users</li>
                      <li>To send you notifications about activity related to your account</li>
                      <li>To respond to your inquiries and provide customer support</li>
                      <li>To improve our service and develop new features</li>
                      <li>To detect, prevent, and address technical issues and security threats</li>
                      <li>To comply with legal obligations</li>
                    </ul>
                  </section>
                  
                  <Separator />
                  
                  {/* Information Sharing and Disclosure */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
                    <p className="mb-4">
                      We may share your information in the following situations:
                    </p>
                    <h3 className="text-lg font-medium mt-4 mb-2">With Your Consent</h3>
                    <p className="mb-4">
                      We may share your information when you have given us permission to do so.
                    </p>
                    
                    <h3 className="text-lg font-medium mt-4 mb-2">Public Information</h3>
                    <p className="mb-4">
                      Any information you post publicly on our platform, such as stories, comments, or profile information, will be visible to other users. You can control some of this visibility through your privacy settings.
                    </p>
                    
                    <h3 className="text-lg font-medium mt-4 mb-2">Service Providers</h3>
                    <p className="mb-4">
                      We may share your information with third-party service providers that help us operate our service, such as:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Cloud storage providers</li>
                      <li>Payment processors (Stripe and PayPal)</li>
                      <li>Authentication services</li>
                      <li>Analytics providers</li>
                    </ul>
                    <p className="mb-4">
                      These service providers are contractually obligated to use your information only as directed by us and in accordance with this Privacy Policy.
                    </p>
                    
                    <h3 className="text-lg font-medium mt-4 mb-2">Legal Requirements</h3>
                    <p className="mb-4">
                      We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
                    </p>
                    
                    <h3 className="text-lg font-medium mt-4 mb-2">Business Transfers</h3>
                    <p className="mb-4">
                      If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on our service of any change in ownership or uses of your information.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Data Storage and Security */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">5. Data Storage and Security</h2>
                    <p className="mb-4">
                      We use commercially reasonable security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. These measures include:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Encryption of sensitive data</li>
                      <li>Secure storage using Azure Blob Storage and Azure PostgreSQL</li>
                      <li>Regular security audits</li>
                      <li>Access controls for our staff</li>
                      <li>HTTPS encryption for all data transfers</li>
                    </ul>
                    <p className="mb-4">
                      However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Your Privacy Choices */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">6. Your Privacy Choices</h2>
                    <p className="mb-4">
                      You have several choices regarding your personal information:
                    </p>
                    <h3 className="text-lg font-medium mt-4 mb-2">Account Information</h3>
                    <p className="mb-4">
                      You can review and update your account information at any time by accessing your account settings.
                    </p>
                    
                    <h3 className="text-lg font-medium mt-4 mb-2">Privacy Settings</h3>
                    <p className="mb-4">
                      You can control certain privacy settings, including:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>Whether to display your email address on your public profile</li>
                      <li>Whether to display your location on your public profile</li>
                      <li>Whether to allow other users to send you direct messages</li>
                    </ul>
                    
                    <h3 className="text-lg font-medium mt-4 mb-2">Communication Preferences</h3>
                    <p className="mb-4">
                      You can manage your notification preferences in your account settings, including email notifications for new followers, comments, likes, and new chapters.
                    </p>
                    
                    <h3 className="text-lg font-medium mt-4 mb-2">Account Deletion</h3>
                    <p className="mb-4">
                      You can request to delete your account by contacting us. When you delete your account, your personal information will be removed from our active databases, though some information may be retained for legal, security, or technical reasons.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Cookies and Tracking Technologies */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking Technologies</h2>
                    <p className="mb-4">
                      We use cookies and similar tracking technologies to track activity on our service and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.
                    </p>
                    <p className="mb-4">
                      We use cookies for the following purposes:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      <li>To maintain your authenticated session</li>
                      <li>To remember your preferences</li>
                      <li>To analyze how you use our service</li>
                      <li>To personalize your experience</li>
                    </ul>
                    <p className="mb-4">
                      You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
                    </p>
                    <div className="mt-4">
                      <span id="ezoic-privacy-policy-embed"></span>
                    </div>
                  </section>
                  
                  <Separator />
                  
                  {/* Children's Privacy */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
                    <p className="mb-4">
                      Our service is not intended for anyone under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we can take necessary actions.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* International Data Transfers */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
                    <p className="mb-4">
                      Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction.
                    </p>
                    <p className="mb-4">
                      If you are located outside the United States and choose to provide information to us, please note that we transfer the data to the United States and process it there. Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Changes to This Privacy Policy */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
                    <p className="mb-4">
                      We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
                    </p>
                    <p className="mb-4">
                      You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                    </p>
                  </section>
                  
                  <Separator />
                  
                  {/* Contact Information */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
                    <p>
                      If you have any questions about this Privacy Policy, please contact us at support@fablespace.space.
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
