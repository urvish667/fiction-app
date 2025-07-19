import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import BlogContent from "./blog-content"

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <BlogContent />
      <SiteFooter />
    </div>
  )
}
