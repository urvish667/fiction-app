import { prisma } from "@/lib/auth/db-adapter";
import { BlogPost, BlogCategory } from "@/types/blog";
import { AzureService } from "@/lib/azure-service";

export const getPublishedBlogs = async (): Promise<BlogPost[]> => {
  const blogs = await prisma.blog.findMany({
    where: {
      status: "published",
    },
    include: {
      author: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return blogs.map((blog) => ({
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    author: blog.author.email,
    category: blog.category as BlogCategory,
    tags: blog.tags,
    featuredImage: blog.imageUrl || "",
    excerpt: blog.excerpt || "",
    content: blog.content,
    publishDate: blog.createdAt,
    readTime: Math.ceil(blog.content.split(" ").length / 200),
    status: blog.status as "draft" | "published",
  }));
};

export const getBlogBySlug = async (slug: string): Promise<BlogPost | null> => {
  const blog = await prisma.blog.findUnique({
    where: {
      slug,
    },
    include: {
      author: true,
    },
  });

  if (!blog) {
    return null;
  }

  const content = await AzureService.getContent(blog.content);

  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    author: blog.author.email,
    category: blog.category as BlogCategory,
    tags: blog.tags,
    featuredImage: blog.imageUrl || "",
    excerpt: blog.excerpt || "",
    content: content,
    publishDate: blog.createdAt,
    readTime: Math.ceil(content.split(" ").length / 200),
    status: blog.status as "draft" | "published",
  };
};
