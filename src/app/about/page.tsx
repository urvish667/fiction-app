import { Sparkles, Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { generateAboutMetadata, generateOrganizationStructuredData } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { Ubuntu, Merriweather } from 'next/font/google';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ubuntu = Ubuntu({
  weight: ['400', '700'],
  subsets: ['latin'],
});

const merriweather = Merriweather({
  weight: ["400", "700"],
  subsets: ['latin'],
})

export const metadata: Metadata = generateAboutMetadata();

export default function AboutPage() {
  const organizationSchema = generateOrganizationStructuredData();

  const faqItems = [
    {
      question: "What is FableSpace?",
      answer:
        "FableSpace is a creative platform where writers share original stories and readers discover immersive fiction. It's a space built to connect storytellers with their audience and make supporting your favorite authors easy and meaningful."
    },
    {
      question: "How do I start writing?",
      answer:
        "Getting started is simple—just sign up and click the 'Start Writing' button. You'll be taken to our clean, distraction-free editor where you can begin crafting and publishing your stories right away."
    },
    {
      question: "Why are there ads on FableSpace?",
      answer:
        "Ads help cover the essential costs of hosting, development, and ongoing improvements to the platform. As the community grows, the goal is to share a portion of ad revenue with writers to support their creative work."
    },
    {
      question: "How do donations work?",
      answer:
        "Readers can support writers directly through external platforms like Buy Me a Coffee and Ko-fi. FableSpace does not take any cut from these donations. We are also actively developing direct integration for PayPal and Stripe to provide more seamless payment options."
    },
    {
      question: "Is FableSpace free to use?",
      answer:
        "Yes. FableSpace is completely free for both writers and readers. Revenue from ads helps keep the platform online and evolving, while ensuring creators can focus on what they do best—telling great stories."
    },
    {
      question: "Do I own the rights to what I publish on FableSpace?",
      answer:
        "Absolutely. You retain full ownership of your stories. FableSpace does not claim any rights over your content—you are free to edit, remove, or republish your work elsewhere at any time."
    },
    {
      question: "Will other payment options be supported in the future?",
      answer:
        "Yes! We are actively working on integrating Stripe and PayPal directly into the platform. This will allow for more straightforward and secure transactions. In the meantime, writers can connect their Buy Me a Coffee and Ko-fi accounts."
    },
    {
      question: "Are there any content guidelines?",
      answer:
        "Yes, we aim to keep FableSpace a respectful, inclusive place for readers and writers of all ages. While mature themes are welcome, content promoting hate, abuse, or illegal activities is not allowed. Please review our content policy before publishing."
    },
    {
      question: "Is there an age limit to join or write on FableSpace?",
      answer:
        "To comply with international privacy and payment laws, users must be at least 13 years old to join. For receiving donations, you may need to meet PayPal’s minimum age requirement in your country."
    },
    {
      question: "Can I delete my account and stories if I want to leave?",
      answer:
        "Yes, you're always in control. You can delete your stories at any time, and if you decide to leave FableSpace, your account and data can be permanently removed on request."
    }
  ]

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  }

  return (
    <>
      {/* Organization Schema Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />

      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-1 container mx-auto px-8 py-12">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">

            <h1 className={`${merriweather.className} text-5xl font-bold mb-6`}>About Us</h1>
            <p className={`${merriweather.className} text-xl text-muted-foreground`}>
              A cozy corner of the internet for storytellers, dreamers, and readers alike.
            </p>
          </div>

          {/* Our Mission */}
          <section className="max-w-3xl mx-auto mb-16">
            <h2 className={`${ubuntu.className} text-4xl font-bold text-center mb-6`}>Our Mission</h2>
            <div className="bg-muted/30 rounded-lg p-8 text-center">
              <p className="text-lg mb-4">
                At FableSpace, we believe in the power of storytelling—and in the storytellers who bring worlds to life. Our mission is to create a space where writers can share their imagination freely, connect with readers, and eventually earn from their creative work.
              </p>
              <p className="text-lg mb-4">
                Right now, we sustain FableSpace through Google Ads to keep the platform alive and growing. While we aren&apos;t yet able to share ad revenue, writers receive 100% of reader donations, ensuring that your support goes directly to them.
              </p>
              <p className="text-lg mb-4">
                But this is just the beginning. As our community grows, so will our support for writers. We&apos;re committed to launching new ways for creators to earn—starting with ad revenue sharing once we reach scale, and expanding into more features designed to help writers thrive.
              </p>
              <p className={`${ubuntu.className} text-lg font-semibold text-primary`}>
                FableSpace is more than a platform—it&apos;s a promise to uplift the voices of tomorrow. 🌱✍️
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="max-w-3xl mx-auto mb-16">
            <h2 className={`${ubuntu.className} text-4xl font-bold text-center mb-8`}>Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className={`${ubuntu.className} text-xl`}>{item.question}</AccordionTrigger>
                  <AccordionContent className="text-lg">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* What Makes Us Different */}
          <section className="max-w-4xl mx-auto mb-16">
            <h2 className={`${ubuntu.className} text-4xl font-bold text-center mb-8`}>What Makes FableSpace Different</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/60 dark:to-emerald-950/60 rounded-lg p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 mr-3">
                    <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className={`${ubuntu.className} font-bold text-xl text-green-800 dark:text-green-200`}>Get Paid by Readers</h3>
                </div>
                <p className="text-green-700 dark:text-green-300 mb-3">
                  Readers can directly support their favorite authors through platforms like Buy Me a Coffee and Ko-fi.
                  We are also working on direct PayPal and Stripe integration for a more seamless experience.
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ 100% of donations go to authors<br/>
                  ✓ Connect your existing accounts<br/>
                  ✓ More payment options coming soon
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 mr-3">
                    <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className={`${ubuntu.className} font-bold text-xl text-blue-800 dark:text-blue-200`}>Creator-First Platform</h3>
                </div>
                <p className="text-blue-700 dark:text-blue-300 mb-3">
                  Unlike other platforms that prioritize algorithms and ads, we put creators first.
                  Your stories aren&apos;t buried under corporate content or paywalled features.
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  ✓ No algorithm manipulation<br/>
                  ✓ All features free for writers<br/>
                  ✓ Reader-focused, distraction-free interface
                </p>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="max-w-3xl mx-auto text-center">
            <h2 className={`${ubuntu.className} text-4xl font-bold mb-6`}>Ready to write your first story?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/write/story-info">Start Writing</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/browse">Explore Stories</Link>
              </Button>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}
