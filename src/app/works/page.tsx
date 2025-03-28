"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PenSquare, Eye, BarChart3, MoreVertical, Trash2, Copy, Archive, X, Heart, MessageSquare } from "lucide-react"
import Navbar from "@/components/navbar"
import { sampleStories } from "@/lib/sample-data"

// Mock story data with additional fields for works
const myWorks = sampleStories.slice(0, 8).map((story, index) => ({
  ...story,
  status: index < 5 ? "published" : "draft",
  lastEdited: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
  completionPercentage: index < 5 ? 100 : Math.floor(Math.random() * 90) + 10,
  chapters: Math.floor(Math.random() * 20) + 1,
}))

export default function MyWorksPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("published")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter stories based on active tab and search query
  const filteredWorks = myWorks.filter((work) => {
    const matchesTab = activeTab === "all" || work.status === activeTab
    const matchesSearch =
      !searchQuery ||
      work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      work.genre.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  // Sort works by last edited date
  filteredWorks.sort((a, b) => b.lastEdited.getTime() - a.lastEdited.getTime())

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">My Works</h1>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Input
                placeholder="Search works..."
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

            <Button asChild>
              <Link href="/write/story-info">
                <PenSquare className="h-4 w-4 mr-2" />
                New Story
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="published" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-8">
            <TabsTrigger value="all">All Works</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <WorksContent works={filteredWorks} searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="published">
            <WorksContent works={filteredWorks} searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="draft">
            <WorksContent works={filteredWorks} searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

interface WorksContentProps {
  works: typeof myWorks
  searchQuery: string
}

function WorksContent({ works, searchQuery }: WorksContentProps) {
  const router = useRouter()

  const handleContinueEditing = (storyId: number) => {
    router.push(`/write/editor/${storyId}`)
  }

  const handleViewStory = (storyId: number) => {
    router.push(`/story/${storyId}`)
  }

  const handleViewAnalytics = (storyId: number) => {
    router.push(`/dashboard/analytics/${storyId}`)
  }

  if (works.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">No stories found</h3>
        <p className="text-muted-foreground mb-6">
          {searchQuery
            ? "Try adjusting your search."
            : "You haven't created any stories yet. Start writing your first story!"}
        </p>
        <Button asChild>
          <Link href="/write/story-info">
            <PenSquare className="h-4 w-4 mr-2" />
            Write New Story
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {works.map((work) => (
          <Card key={work.id} className="overflow-hidden flex flex-col">
            <div className="relative aspect-[3/2] overflow-hidden">
              <Image src={work.thumbnail || "/placeholder.svg"} alt={work.title} fill className="object-cover" />
              <Badge
                className={`absolute top-2 right-2 ${work.status === "published" ? "bg-green-500" : "bg-amber-500"}`}
              >
                {work.status === "published" ? "Published" : "Draft"}
              </Badge>

              {work.status === "draft" && (
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-3 py-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span>Completion: {work.completionPercentage}%</span>
                    <span>Chapters: {work.chapters}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${work.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <CardContent className="flex-grow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg line-clamp-1">{work.title}</h3>
                  <p className="text-sm text-muted-foreground">{work.genre}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleContinueEditing(work.id)}>
                      <PenSquare className="h-4 w-4 mr-2" />
                      Edit Story
                    </DropdownMenuItem>
                    {work.status === "published" && (
                      <DropdownMenuItem onClick={() => handleViewStory(work.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Story
                      </DropdownMenuItem>
                    )}
                    {work.status === "published" && (
                      <DropdownMenuItem onClick={() => handleViewAnalytics(work.id)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                Last edited: {work.lastEdited.toLocaleDateString()}
              </div>

              {work.status === "published" && (
                <div className="flex gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{work.reads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{work.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{work.comments.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
              {work.status === "draft" ? (
                <>
                  <Button className="flex-1" onClick={() => handleContinueEditing(work.id)}>
                    <PenSquare className="h-4 w-4 mr-2" />
                    Continue Writing
                  </Button>
                  <Button variant="outline">Publish</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" onClick={() => handleViewStory(work.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button onClick={() => handleContinueEditing(work.id)}>
                    <PenSquare className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}

