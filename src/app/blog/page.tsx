import { Navbar, SiteFooter } from "@/components/layout"
import { BlogContent } from "@/features/blog"
import { AdBanner } from "@/components/common"
import { fetchPublishedBlogs } from "@/lib/server/blog-data"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function BlogPage() {
  const initialBlogs = await fetchPublishedBlogs()

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <BlogContent initialBlogs={initialBlogs} />
        <div className="w-full py-4">
          <AdBanner
            type="banner"
            className="w-full max-w-[720px] h-[90px] mx-auto"
            slot="6596765108"
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
