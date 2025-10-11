/**
 * Server-side data fetching utilities for blog page
 * This enables SSR for better SEO and Google indexing
 */

import { prisma } from "@/lib/auth/db-adapter";
import { BlogPost } from "@/types/blog";

/**
 * Fetch published blogs from database (server-side only)
 * This function should only be called from Server Components
 */
export async function fetchPublishedBlogs(): Promise<BlogPost[]> {
  try {
    const blogs = await prisma.blog.findMany({
      where: {
        status: 'published'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        imageUrl: true,
        category: true,
        tags: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            email: true,
          }
        }
      }
    });

    // Transform to BlogPost format
    const transformedBlogs: BlogPost[] = blogs.map(blog => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      content: blog.content,
      featuredImage: blog.imageUrl || '/placeholder-blog.jpg',
      category: blog.category as any, // Type cast to match enum
      tags: Array.isArray(blog.tags) ? blog.tags : [],
      author: blog.author.email.split('@')[0] || 'FableSpace Team',
      readTime: Math.ceil(blog.content.split(' ').length / 200), // Approximate read time
      status: blog.status as 'draft' | 'published',
      publishDate: blog.createdAt,
    }));

    return transformedBlogs;
  } catch (error) {
    console.error("Error fetching published blogs:", error);
    return [];
  }
}
