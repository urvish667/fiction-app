import { notFound } from "next/navigation";
import { getBlogBySlug } from "@/services/blog-service";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Navbar from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { Metadata } from "next";
import { logger } from "@azure/storage-blob";
import { Badge } from "@/components/ui/badge";

interface BlogPageProps {
  params: {
    slug: string;
  };
}

const formatString = (str: string) => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  try {
    const blog = await getBlogBySlug(params.slug);
    if (!blog) {
      return {
        title: "Blog Post Not Found - FableSpace",
        description: "The blog post you're looking for could not be found.",
      };
    }
    return {
      title: `${blog.title} - FableSpace Blog`,
      description: blog.excerpt,
      keywords: blog.tags,
      openGraph: {
        title: blog.title,
        description: blog.excerpt,
        type: "article",
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/blog/${blog.slug}`,
        images: [
          {
            url: blog.featuredImage || `${process.env.NEXT_PUBLIC_BASE_URL}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: blog.title,
          },
        ],
      },
    };
  } catch (error) {
    return {
      title: "Blog Post Not Found - FableSpace",
      description: "The blog post you're looking for could not be found.",
    };
  }
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  try {
    const blog = await getBlogBySlug(params.slug);

    if (!blog || blog.status !== "published") {
      notFound();
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": blog.title,
      "name": blog.title,
      "description": blog.excerpt,
      "image": blog.featuredImage || `${process.env.NEXT_PUBLIC_BASE_URL}/og-image.jpg`,
      "author": {
        "@type": "Organization",
        "name": "FableSpace",
        "url": `${process.env.NEXT_PUBLIC_BASE_URL}`
      },
      "publisher": {
        "@type": "Organization",
        "name": "FableSpace",
        "logo": {
          "@type": "ImageObject",
          "url": `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`
        }
      },
      "datePublished": blog.publishDate?.toISOString(),
      "dateModified": blog.publishDate?.toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${process.env.NEXT_PUBLIC_BASE_URL}/blog/${blog.slug}`
      },
      "keywords": blog.tags.join(", "),
      "articleSection": blog.category,
    };

    return (
      <div className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Navbar />
        <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="max-w-3xl mx-auto">
            <article>
              <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="text-xs sm:text-sm">By {"FableSpace"}</span>
                <span className="hidden xs:inline">•</span>
                <Badge variant="outline" className="mr-1">
                  {formatString(blog.category)}
                </Badge>
                <span className="hidden xs:inline">•</span>
                <span className="text-xs sm:text-sm">Created {blog.publishDate?.toLocaleDateString()}</span>
              </div>
              {blog.featuredImage && (
                <img
                  src={blog.featuredImage}
                  alt={blog.title}
                  className="w-full h-auto rounded-lg mb-8"
                />
              )}
              <MarkdownRenderer content={blog.content} />
            </article>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  } catch (error) {
    logger.error("Error loading blog post page:", error);
    notFound();
  }
}
