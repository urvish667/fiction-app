"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, ArrowRight } from "lucide-react"
import { BlogPost } from "@/types/blog"

interface BlogCardProps {
  post: BlogPost
  viewMode?: "grid" | "list"
}

export default function BlogCard({ post, viewMode = "grid" }: BlogCardProps) {
  const isGrid = viewMode === "grid"

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) {
      return null
    }
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return null
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(dateObj)
  }

  const formatString = (str: string) => {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ANNOUNCEMENT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      WRITING_TIPS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      AUTHOR_INTERVIEWS: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      PLATFORM_UPDATES: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      STORYTELLING_INSIGHTS: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    }
    return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card className={`h-full overflow-hidden group ${isGrid ? "flex-col" : "flex-row"} flex`}>
        {/* Featured Image */}
        <div className={`${isGrid ? "w-full" : "w-1/3"} relative overflow-hidden`}>
          <div className={`relative ${isGrid ? "aspect-[16/10]" : "h-full min-h-[200px]"}`}>
            <Image
              src={post.featuredImage || "/placeholder.svg"}
              alt={post.title}
              fill
              className="object-cover"
            />
            {/* Category Badge */}
            <Badge className={`absolute top-3 left-3 ${getCategoryColor(post.category)}`}>{formatString(post.category)}</Badge>
          </div>
        </div>

        {/* Content */}
        <div className={`${isGrid ? "w-full" : "w-2/3"} flex flex-col`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              {formatDate(post.publishDate) && (
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{formatDate(post.publishDate)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{post.readTime} min read</span>
              </div>
            </div>

            <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h3>

          </CardHeader>

          <CardContent className="pb-3 flex-grow">
            <p className="text-muted-foreground line-clamp-3 mb-4">{post.excerpt}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {formatString(tag)}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{post.tags.length - 3} more
                </Badge>
              )}
            </div>
          </CardContent>

          <CardFooter className="pt-0">
            <Link href={`/blog/${post.slug}`} className="w-full">
              <Button variant="ghost" className="w-full justify-between group/btn">
                Read More
                <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </CardFooter>
        </div>
      </Card>
    </motion.div>
  )
}
