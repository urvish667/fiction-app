"use client"

import { useState, useEffect, useCallback } from "react"
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
import { PenSquare, Eye, BarChart3, MoreVertical, Trash2, Copy, X, Heart, MessageSquare, BookOpen, Loader2, Clock } from "lucide-react"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import Navbar from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"
import { StoryService } from "@/services/story-service"
import { useSession } from "next-auth/react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { Story } from "@/types/story"
import { logError } from "@/lib/error-logger"

// Extended story type with UI-specific properties
interface WorkStory extends Omit<Story, 'genre'> {
  lastEdited: Date;
  draftChapters: number;
  scheduledChapters: number;
  publishedChapters: number;
  genre?: string | { name: string } | null;
}

export default function MyWorksPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [myWorks, setMyWorks] = useState<WorkStory[]>([])
  const [pagination, setPagination] = useState({ page: 1, hasMore: true });
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<{id: string, title: string} | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchStories = useCallback(async (page = 1, isMounted: () => boolean) => {
    if (!session?.user?.id) return;

    // If we're fetching more, don't show the main loader
    if (page > 1) {
      setIsFetchingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await StoryService.getStories({
        authorId: session.user.id,
        page: page,
        limit: 12 // Explicitly set limit to match API
      });

      // Create a batch of promises to fetch chapters for all stories
      const storiesWithChaptersPromises = response.stories.map(async (story) => {
        try {
          // Fetch chapters for this story
          const chapters = await StoryService.getChapters(story.id);

          // Only process if component is still mounted
          if (!isMounted()) return null;

          // Count chapters by status
          const draftChapters = chapters.filter(chapter => chapter.status === 'draft').length;
          const scheduledChapters = chapters.filter(chapter => chapter.status === 'scheduled').length;
          const publishedChapters = chapters.filter(chapter => chapter.status === 'published').length;

          return {
            ...story,
            lastEdited: new Date(story.updatedAt),
            draftChapters,
            scheduledChapters,
            publishedChapters
          };
        } catch (error) {
          logError(error, { context: 'Fetching chapters for story', storyId: story.id })
          // Return the story without chapter counts if fetching chapters fails
          return {
            ...story,
            lastEdited: new Date(story.updatedAt),
            draftChapters: 0,
            scheduledChapters: 0,
            publishedChapters: 0
          };
        }
      });

      // Wait for all chapter fetches to complete
      const worksWithChapters = await Promise.all(storiesWithChaptersPromises);

      // Only update state if component is still mounted
      if (isMounted()) {
        const works = worksWithChapters.filter(Boolean) as WorkStory[];
        
        // If it's the first page, replace the stories. Otherwise, append them.
        setMyWorks(prevWorks => (page === 1 ? works : [...prevWorks, ...works]));
        
        // Update pagination state
        setPagination({
          page: response.pagination.page,
          hasMore: response.pagination.hasMore,
        });

        if (page > 1) {
          setIsFetchingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    } catch (error) {
      logError(error, { context: 'Fetching user stories' })
      if (isMounted()) {
        toast({
          title: "Error",
          description: "Failed to load your stories. Please try again.",
          variant: "destructive"
        })
        setIsLoading(false)
      }
    }
  }, [session?.user?.id, toast]);

  // Fetch user's stories from the database
  useEffect(() => {
    let isMounted = true;
    fetchStories(1, () => isMounted);

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [fetchStories]);

  // Function to load more stories
  const loadMoreStories = () => {
    if (!pagination.hasMore || isFetchingMore) return;
    // We can assume the component is mounted if this is called
    fetchStories(pagination.page + 1, () => true);
  };

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
      logError(error, { context: 'Deleting story', storyId: storyToDelete.id })
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
    // Extract genre name for search
    let genreName = 'General';
    if (typeof work.genre === 'string') {
      genreName = work.genre;
    } else if (work.genre && typeof work.genre === 'object' && 'name' in work.genre) {
      genreName = String(work.genre.name);
    }

    const matchesSearch =
      !searchQuery ||
      work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (genreName && genreName.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesTab && matchesSearch
  })

  // Sort works by last edited date
  filteredWorks.sort((a, b) => b.lastEdited.getTime() - a.lastEdited.getTime())

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 md:px-8 py-4 md:py-8">
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
          <div className="overflow-x-auto sm:overflow-x-visible px-4 -mx-4 md:px-0 md:mx-0">
            <TabsList className="mb-8 w-max sm:w-auto ml-0 sm:ml-0">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All Works</TabsTrigger>
              <TabsTrigger value="draft" className="text-xs sm:text-sm">Drafts</TabsTrigger>
              <TabsTrigger value="ongoing" className="text-xs sm:text-sm">Ongoing</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
            </TabsList>
          </div>

          {/* Use a single TabsContent component that renders for all tab values */}
          <TabsContent value={activeTab}>
            <WorksContent
              works={filteredWorks}
              searchQuery={searchQuery}
              isLoading={isLoading}
              onDeleteStory={openDeleteDialog}
            />
            
            {/* Load More Button */}
            {pagination.hasMore && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMoreStories}
                  disabled={isFetchingMore}
                  className="border-2 border-primary"
                >
                  {isFetchingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={`skeleton-${index}`}>
            <StoryCardSkeleton viewMode="grid" />
          </div>
        ))}
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
    <motion.div
      layout
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {works.map((work) => (
        <motion.div
          key={work.id}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden flex flex-col h-full">
            <div className="relative aspect-[3/2] overflow-hidden bg-muted">
              {/* Cover image */}
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
                    <span>Published: {work.publishedChapters || 0}</span>
                  </span>
                  <div className="flex gap-2">
                    {work.scheduledChapters > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Scheduled: {work.scheduledChapters}</span>
                      </span>
                    )}
                    {work.draftChapters > 0 && (
                      <span className="flex items-center gap-1">
                        <PenSquare className="h-3.5 w-3.5" />
                        <span>Drafts: {work.draftChapters}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="flex-grow p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg line-clamp-1">{work.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      if (typeof work.genre === 'string') {
                        return work.genre;
                      } else if (work.genre && typeof work.genre === 'object' && 'name' in work.genre) {
                        return String(work.genre.name);
                      }
                      return 'General';
                    })()}
                  </p>
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
                    {/* {work.status !== "draft" && (
                      <DropdownMenuItem onClick={() => handleViewAnalytics(work.id)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                    )} */}
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
                    <span>{work.viewCount?.toLocaleString() || 0}</span>
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
                    <span>{work.publishedChapters?.toLocaleString() || 0} published</span>
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
        </motion.div>
      ))}
    </motion.div>
  )
}
