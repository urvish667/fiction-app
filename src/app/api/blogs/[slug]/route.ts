import { NextResponse } from "next/server";
import { getBlogBySlug } from "@/services/blog-service";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const blog = await getBlogBySlug(slug);
    if (!blog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }
    return NextResponse.json(blog);
  } catch (error) {
    console.error(`Failed to fetch blog with slug ${slug}:`, error);
    return NextResponse.json(
      { message: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}
