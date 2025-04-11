"use client"

import { useState, useEffect } from "react"
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
import { PenSquare, Eye, BarChart3, MoreVertical, Trash2, Copy, X, Heart, MessageSquare, BookOpen, Loader2 } from "lucide-react"
import Navbar from "@/components/navbar"
import { useToast } from "@/components/ui/use-toast"
import { StoryService } from "@/services/story-service"
import { useSession } from "next-auth/react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { Story } from "@/types/story"

// Extended story type with UI-specific properties
interface WorkStory extends Story {
  lastEdited: Date;
  draftChapters: number;
}

export default function MyWorksPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [myWorks, setMyWorks] = useState<WorkStory[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<{id: string, title: string} | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch user's stories from the database
  useEffect(() => {
    const fetchStories = async () => {
      if (!session?.user?.id) return

      try {
        setIsLoading(true)
        const response = await StoryService.getStories({
          authorId: session.user.id
        })

        // Get chapters for each story to count draft chapters
        const worksWithChapters = await Promise.all(response.stories.map(async (story) => {
          let draftChapters = 0;
          try {
            const chapters = await StoryService.getChapters(story.id);
            draftChapters = chapters.filter(chapter =>
              chapter.status === 'draft' || chapter.status === 'scheduled'
            ).length;
          } catch (error) {
            console.error(`Failed to fetch chapters for story ${story.id}:`, error);
          }

          return {
            ...story,
            lastEdited: new Date(story.updatedAt),
            draftChapters
          };
        }));

        // Transform API response to our WorkStory format
        const works = worksWithChapters as WorkStory[]

        setMyWorks(works)
      } catch (error) {
        console.error("Failed to fetch stories:", error)
        toast({
          title: "Error",
          description: "Failed to load your stories. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [session, toast])

  // Open delete confirmation dialog
  const openDeleteDialog = (story: {id: string, title: string}) => {
    setStoryToDelete(story)
    setDeleteDialogOpen(true)
  }

  // Handle story deletion
  const handleDeleteStory = async () => {
    if (!storyToDelete) return

    setIsDeleting(true)
    try {
      await StoryService.deleteStory(storyToDelete.id)

      // Update the local state by removing the deleted story
      setMyWorks(prevWorks => prevWorks.filter(work => work.id !== storyToDelete.id))

      toast({
        title: "Story deleted",
        description: `"${storyToDelete.title}" has been deleted successfully.`,
      })

      // Close the dialog
      setDeleteDialogOpen(false)
      setStoryToDelete(null)
    } catch (error) {
      console.error("Failed to delete story:", error)
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete the story. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter stories based on active tab and search query
  const filteredWorks = myWorks.filter((work) => {
    // Define what each tab means:
    // - draft: stories with status="draft" (no published chapters)
    // - ongoing: stories with status="ongoing" (at least one published chapter, more coming)
    // - completed: stories with status="completed" (all chapters published, story ended)
    const matchesTab = activeTab === "all" ||
                      (activeTab === "draft" && work.status === "draft") ||
                      (activeTab === "ongoing" && work.status === "ongoing") ||
                      (activeTab === "completed" && work.status === "completed")
    const matchesSearch =
      !searchQuery ||
      work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (work.genre && work.genre.toLowerCase().includes(searchQuery.toLowerCase()))

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

            <Button asChild className="border-2 border-primary">
              <Link href="/write/story-info">
                <PenSquare className="h-4 w-4 mr-2" />
                New Story
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-8">
            <TabsTrigger value="all">All Works</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <WorksContent
              works={filteredWorks}
              searchQuery={searchQuery}
              isLoading={isLoading}
              onDeleteStory={openDeleteDialog}
            />
          </TabsContent>

          <TabsContent value="draft">
            <WorksContent
              works={filteredWorks}
              searchQuery={searchQuery}
              isLoading={isLoading}
              onDeleteStory={openDeleteDialog}
            />
          </TabsContent>

          <TabsContent value="ongoing">
            <WorksContent
              works={filteredWorks}
              searchQuery={searchQuery}
              isLoading={isLoading}
              onDeleteStory={openDeleteDialog}
            />
          </TabsContent>

          <TabsContent value="completed">
            <WorksContent
              works={filteredWorks}
              searchQuery={searchQuery}
              isLoading={isLoading}
              onDeleteStory={openDeleteDialog}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Story Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this story?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the story
              "{storyToDelete?.title}" and all its chapters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteStory();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Story"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface WorksContentProps {
  works: WorkStory[]
  searchQuery: string
  isLoading: boolean
  onDeleteStory: (story: {id: string, title: string}) => void
}

function WorksContent({ works, searchQuery, isLoading, onDeleteStory }: WorksContentProps) {
  const router = useRouter()

  const handleContinueEditing = (storyId: string) => {
    // Redirect to story-metadata page instead of editor
    router.push(`/write/story-info?id=${storyId}`)
  }

  const handleViewStory = (_storyId: string, slug: string) => {
    router.push(`/story/${slug}`)
  }

  const handleViewAnalytics = (storyId: string) => {
    router.push(`/dashboard/analytics/${storyId}`)
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Loading your stories...</h3>
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 bg-muted-foreground/20 rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
        </div>
      </div>
    )
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
        <Button asChild className="border-2 border-primary">
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
              {/* Log the coverImage for debugging */}
              <>{console.log(`Story ${work.id} coverImage:`, work.coverImage)}</>
              <Image
                src={work.coverImage || "/placeholder.svg"}
                alt={work.title}
                fill
                className="object-cover"
                unoptimized={true} // Always use unoptimized for external images
              />
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {/* Show only one primary status badge */}
                {work.status === "draft" ? (
                  <Badge className="bg-amber-500">Draft</Badge>
                ) : (
                  <Badge
                    className={`${work.status === "completed" ? "bg-blue-500" : "bg-purple-500"}`}
                  >
                    {work.status === "completed" ? "Completed" : "Ongoing"}
                  </Badge>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-3 py-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Chapters: {work.chapterCount || 0}</span>
                  </span>
                  {work.draftChapters > 0 && (
                    <span className="flex items-center gap-1">
                      <PenSquare className="h-3.5 w-3.5" />
                      <span>Drafts: {work.draftChapters}</span>
                    </span>
                  )}
                </div>
              </div>
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
                    {work.status !== "draft" && (
                      <DropdownMenuItem onClick={() => handleViewStory(work.id, work.slug)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Story
                      </DropdownMenuItem>
                    )}
                    {work.status !== "draft" && (
                      <DropdownMenuItem onClick={() => handleViewAnalytics(work.id)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDeleteStory({id: work.id, title: work.title})}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                Last edited: {work.lastEdited.toLocaleDateString()}
              </div>

              {work.status !== "draft" && (
                <div className="flex gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{work.readCount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{work.likeCount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{work.commentCount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{work.chapterCount?.toLocaleString() || 0} chapters</span>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
              {work.status === "draft" ? (
                <Button className="flex-1" onClick={() => handleContinueEditing(work.id)}>
                  <PenSquare className="h-4 w-4 mr-2" />
                  Continue Writing
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" onClick={() => handleViewStory(work.id, work.slug)}>
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

