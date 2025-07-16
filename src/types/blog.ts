export enum BlogCategory {
  ANNOUNCEMENT = "ANNOUNCEMENT",
  WRITING_TIPS = "WRITING_TIPS",
  AUTHOR_INTERVIEWS = "AUTHOR_INTERVIEWS",
  PLATFORM_UPDATES = "PLATFORM_UPDATES",
  STORYTELLING_INSIGHTS = "STORYTELLING_INSIGHTS",
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  author: string
  category: BlogCategory
  tags: string[]
  featuredImage: string
  excerpt: string
  content: string
  publishDate?: Date
  readTime: number
  status: "draft" | "published";
}
