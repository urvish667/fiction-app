import type { Metadata } from "next"
import { generateContactMetadata } from "@/lib/seo/page-metadata"
import { ContactForm } from "@/app/contact/contact-form"

export const metadata: Metadata = generateContactMetadata()

export default function ContactPage() {
  return <ContactForm />
}
