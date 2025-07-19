"use client"

import { motion, AnimatePresence } from "framer-motion"
import BlogCard from "@/components/blog-card"
import { AdSlot } from "@/components/ad-slot"
import { BlogPost } from "@/types/blog"

interface BlogGridProps {
  posts: BlogPost[]
  viewMode: "grid" | "list"
}

export default function BlogGrid({ posts, viewMode }: BlogGridProps) {
  return (
    <motion.div
      layout
      className={`grid gap-8 ${
        viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
      }`}
    >
      <AnimatePresence>
        {posts.map((post, index) => (
          <motion.div
            key={post.id.toString()}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <BlogCard post={post} viewMode={viewMode} />

            {/* Insert ads after every 6 posts */}
            {(index + 1) % 6 === 0 && index !== posts.length - 1 && (
              <div className={viewMode === "grid" ? "col-span-full" : ""}>
                <AdSlot id="blog-native-add" page="other" adType="native" className="my-6" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
