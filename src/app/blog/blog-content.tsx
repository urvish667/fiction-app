"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Grid, List } from "lucide-react"
import { BlogPost, BlogCategory } from "@/types/blog"
import BlogGrid from "./blog-grid"
import Loading from "./loading"
import HorizontalBlogFilterBar from "@/components/horizontal-blog-filter-bar"

const formatString = (str: string) => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

interface BlogContentProps {
  initialBlogs: BlogPost[]
}

export default function BlogContent({ initialBlogs }: BlogContentProps) {
  // Initialize with server-side data
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogs)
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(initialBlogs)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const postsPerPage = 9

  // No need to fetch on mount - we have server-side data
  // If you need to refresh data, you can add a refresh function here

  // Filter posts based on search, category, and tags
  useEffect(() => {
    let results = [...blogPosts]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.author.toLowerCase().includes(query) ||
          post.category.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      results = results.filter((post) => selectedCategories.includes(post.category))
    }

    // Apply tag filter
    if (selectedTag) {
      results = results.filter((post) => post.tags.includes(selectedTag))
    }

    setFilteredPosts(results)
    setCurrentPage(1)
  }, [searchQuery, selectedCategories, selectedTag, blogPosts])

  // Get unique categories and tags
  const categories = Object.values(BlogCategory)

  // Calculate pagination
  const indexOfLastPost = currentPage * postsPerPage
  const indexOfFirstPost = indexOfLastPost - postsPerPage
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setSelectedTag(null)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold">Blogs</h1>

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

        <HorizontalBlogFilterBar
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
            <Loading
              viewMode={viewMode}
              gridClassName={`grid gap-8 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                }`}
            />
          </div>
        ) : filteredPosts.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"} found
                {searchQuery && <span> for "{searchQuery}"</span>}
                {selectedCategories.length > 0 && <span> in {selectedCategories.map(c => formatString(c)).join(', ')}</span>}
                {selectedTag && <span> tagged with "{selectedTag}"</span>}
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
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button onClick={clearFilters}>Clear all filters</Button>
          </div>
        )}
      </div>
    </div>
  )
}
