"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Grid, List } from "lucide-react"
import { BlogPost, BlogCategory } from "@/types/blog"
import { BlogGrid } from "./blog-grid"
import { BlogFilterBar } from "./blog-filter-bar"
import { BlogLoading } from "./blog-loading"
import { formatString } from "./blog-card"
import type { BlogContentProps } from "../types/blog.types"

const POSTS_PER_PAGE = 9

export function BlogContent({ initialBlogs }: BlogContentProps) {
  const [blogPosts] = useState<BlogPost[]>(initialBlogs)
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(initialBlogs)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading] = useState(false)

  // Filter posts based on search, category, and tags with guard clauses
  useEffect(() => {
    let results = [...blogPosts]

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      results = results.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.author.toLowerCase().includes(query) ||
          post.category.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    if (selectedCategories.length > 0) {
      results = results.filter((post) => selectedCategories.includes(post.category))
    }

    if (selectedTag) {
      results = results.filter((post) => post.tags.includes(selectedTag))
    }

    setFilteredPosts(results)
    setCurrentPage(1)
  }, [searchQuery, selectedCategories, selectedTag, blogPosts])

  const categories = Object.values(BlogCategory)
  const indexOfLastPost = currentPage * POSTS_PER_PAGE
  const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setSelectedTag(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">Blogs</h1>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-primary/10" : ""}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-primary/10" : ""}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <BlogFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={categories.map((category) => formatString(category))}
          selectedCategories={selectedCategories.map((c) => formatString(c))}
          onCategoryChange={(cats: string[]) => {
            const originalCats = cats
              .map((c) => Object.values(BlogCategory).find((cat) => formatString(cat) === c))
              .filter(Boolean) as string[]
            setSelectedCategories(originalCats)
          }}
        />
      </div>

      <div className="w-full">
        {loading ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">Loading articles...</p>
            </div>
            <BlogLoading
              viewMode={viewMode}
              gridClassName={`grid gap-8 ${
                viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              }`}
            />
          </div>
        ) : filteredPosts.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"} found
                {searchQuery && <span> for &quot;{searchQuery}&quot;</span>}
                {selectedCategories.length > 0 && (
                  <span> in {selectedCategories.map((c) => formatString(c)).join(", ")}</span>
                )}
                {selectedTag && <span> tagged with &quot;{selectedTag}&quot;</span>}
              </p>
            </div>

            <BlogGrid posts={currentPosts} viewMode={viewMode} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
            <Button onClick={clearFilters}>Clear all filters</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogContent
