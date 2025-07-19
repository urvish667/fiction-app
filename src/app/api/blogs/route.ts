import { NextResponse } from "next/server"
import { getPublishedBlogs } from "@/services/blog-service"
import { unstable_cache as cache } from "next/cache"

export async function GET() {
  try {
    const getCachedBlogs = cache(
      async () => getPublishedBlogs(),
      ["published-blogs"],
      {
        revalidate: 60, // Revalidate every 60 seconds
      },
    )

    const blogs = await getCachedBlogs()
    return NextResponse.json(blogs)
  } catch (error) {
    console.error("Failed to fetch blogs:", error)
    return NextResponse.json({ message: "Failed to fetch blogs" }, { status: 500 })
  }
}
