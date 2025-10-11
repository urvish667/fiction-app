import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import BlogContent from "./blog-content"
import AdBanner from "@/components/ad-banner"
import { fetchPublishedBlogs } from "@/lib/server/blog-data"

export default async function BlogPage() {
  // Fetch initial blog data server-side for SEO
  const initialBlogs = await fetchPublishedBlogs()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <BlogContent initialBlogs={initialBlogs} />
      <div className="w-full py-2">
        <AdBanner
          type="banner"
          className="w-full max-w-[720px] h-[90px] mx-auto"
          slot="6596765108"
        />
      </div>
      <SiteFooter />
    </div>
  )
}
