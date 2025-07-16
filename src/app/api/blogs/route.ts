import { NextResponse } from "next/server";
import { getPublishedBlogs } from "@/services/blog-service";

export async function GET() {
  try {
    const blogs = await getPublishedBlogs();
    return NextResponse.json(blogs);
  } catch (error) {
    console.error("Failed to fetch blogs:", error);
    return NextResponse.json(
      { message: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}
