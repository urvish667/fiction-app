import { Metadata } from "next"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import CommunityClient from "./community-client"

export const metadata: Metadata = {
  title: "Community",
  description:
    "Connect with writers and readers on FableSpace. Browse author forums, discover the latest discussions, and join us on Reddit, Discord, and Lemmy.",
  openGraph: {
    title: "FableSpace Community",
    description:
      "Connect with writers and readers on FableSpace. Browse author forums, discover the latest discussions, and join our communities.",
    type: "website",
  },
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-8">
        <CommunityClient />
      </main>
      <SiteFooter />
    </div>
  )
}
