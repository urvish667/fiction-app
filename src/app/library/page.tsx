"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Grid, List, X } from "lucide-react"
import Navbar from "@/components/navbar"
import StoryCard from "@/components/story-card"
import { sampleStories } from "@/lib/sample-data"

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterGenre, setFilterGenre] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  // Mock saved stories - in a real app, this would come from an API
  const savedStories = sampleStories.slice(0, 10)

  // Mock currently reading stories
  const currentlyReadingStories = sampleStories.slice(0, 3)

  // Mock completed stories
  const completedStories = sampleStories.slice(3, 6)

  // Filter and sort stories based on user selections
  const filterStories = (stories: typeof sampleStories) => {
    let filtered = [...stories]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (story) =>
          story.title.toLowerCase().includes(query) ||
          story.author.toLowerCase().includes(query) ||
          story.genre.toLowerCase().includes(query),
      )
    }

    // Apply genre filter
    if (filterGenre !== "all") {
      filtered = filtered.filter((story) => story.genre === filterGenre)
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => b.date.getTime() - a.date.getTime())
        break
      case "oldest":
        filtered.sort((a, b) => a.date.getTime() - b.date.getTime())
        break
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "author":
        filtered.sort((a, b) => a.author.localeCompare(b.author))
        break
      case "mostRead":
        filtered.sort((a, b) => b.reads - a.reads)
        break
    }

    return filtered
  }

  // Get filtered stories based on active tab
  const getActiveStories = () => {
    switch (activeTab) {
      case "reading":
        return filterStories(currentlyReadingStories)
      case "completed":
        return filterStories(completedStories)
      default:
        return filterStories(savedStories)
    }
  }

  const filteredStories = getActiveStories()

  // Get unique genres for filter dropdown
  const genres = ["all", ...new Set(savedStories.map((story) => story.genre))]

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">My Library</h1>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Input
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="mostRead">Most Read</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre === "all" ? "All Genres" : genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-primary/10" : ""}
                >
                  <Grid className="h-4 w-4" />
                  <span className="sr-only">Grid view</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-primary/10" : ""}
                >
                  <List className="h-4 w-4" />
                  <span className="sr-only">List view</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-8">
            <TabsTrigger value="all">All Saved</TabsTrigger>
            <TabsTrigger value="reading">Currently Reading</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <LibraryContent stories={filteredStories} viewMode={viewMode} searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="reading">
            <LibraryContent stories={filteredStories} viewMode={viewMode} searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="completed">
            <LibraryContent stories={filteredStories} viewMode={viewMode} searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

interface LibraryContentProps {
  stories: typeof sampleStories
  viewMode: "grid" | "list"
  searchQuery: string
}

function LibraryContent({ stories, viewMode, searchQuery }: LibraryContentProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {stories.length > 0 ? (
        <div
          className={`grid gap-6 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          }`}
        >
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} viewMode={viewMode} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">No stories found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "Try adjusting your search or filters."
              : "Your library is empty. Start browsing and save stories to read later!"}
          </p>
          <Button asChild>
            <Link href="/browse">Browse Stories</Link>
          </Button>
        </div>
      )}
    </motion.div>
  )
}

