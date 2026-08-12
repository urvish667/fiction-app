"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PenSquare, X, Loader2 } from "lucide-react"
import StoryCardSkeleton from "@/components/story-card-skeleton"
import StoryCard from "@/components/story-card"
import Navbar from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"
import { StoryService } from "@/lib/api/story"
import { ChapterService } from "@/lib/api/chapter"
import { ImageService } from "@/lib/api/images"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { Story } from "@/types/story"
import { logError } from "@/lib/error-logger"

// Extended story type with UI-specific properties
interface WorkStory extends Omit<Story, 'genre'> {
  lastEdited: any; // Can be Date, string, or object from API
  draftChapters: number;
  scheduledChapters: number;
  publishedChapters: number;
  genre?: string | { name: string } | null;
}

export default function MyWorksPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useRequireAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [myWorks, setMyWorks] = useState<WorkStory[]>([])
  const [pagination, setPagination] = useState({ page: 1, hasMore: true });
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<{ id: string, title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchStories = useCallback(async (page = 1, isMounted: () => boolean) => {
    if (!user?.id) return;

    // If we're fetching more, don't show the main loader
    if (page > 1) {
      setIsFetchingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await StoryService.getStories({
        authorId: user.id,
        status: ['draft', 'ongoing', 'completed'],
        page: page,
        limit: 12 // Explicitly set limit to match API
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch stories");
      }

      // Create a batch of promises to fetch chapters for all stories
      const storiesWithChaptersPromises = response.data.stories.map(async (story) => {
        try {
          // Fetch chapters for this story
          const chaptersResponse = await ChapterService.getChapters(story.id);
          const chapters = chaptersResponse.success && chaptersResponse.data ? chaptersResponse.data : [];

          // Only process if component is still mounted
          if (!isMounted()) return null;

          // Count chapters by status
          const draftChapters = chapters.filter(chapter => chapter.status === 'draft').length;
          const scheduledChapters = chapters.filter(chapter => chapter.status === 'scheduled').length;
          const publishedChapters = chapters.filter(chapter => chapter.status === 'published').length;

          return {
            ...story,
            lastEdited: story.updatedAt,
            draftChapters,
            scheduledChapters,
            publishedChapters
          };
        } catch (error) {
          logError(error, { context: 'Fetching chapters for story', storyId: story.id })
          // Return the story without chapter counts if fetching chapters fails
          return {
            ...story,
            lastEdited: story.updatedAt,
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
          page: response.data.pagination.page,
          hasMore: response.data.pagination.hasMore,
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
  }, [user?.id, toast]);

  // Fetch user's stories from the database
  useEffect(() => {
    let isMounted = true;
    fetchStories(1, () => isMounted);

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [fetchStories]);

  // Refetch stories when page becomes visible (user navigates back from editor)
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only refetch if page is visible and we have a user ID
      if (!document.hidden && user?.id) {
        // Reset to first page to get latest data
        fetchStories(1, () => true);
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also refetch when window gains focus (for better UX)
    window.addEventListener('focus', () => {
      if (user?.id) {
        fetchStories(1, () => true);
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [user?.id, fetchStories]);

  // Function to load more stories
  const loadMoreStories = () => {
    if (!pagination.hasMore || isFetchingMore) return;
    // We can assume the component is mounted if this is called
    fetchStories(pagination.page + 1, () => true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (story: { id: string, title: string }) => {
    setStoryToDelete(story)
    setDeleteDialogOpen(true)
  }

  // Handle story deletion
  const handleDeleteStory = async () => {
    if (!storyToDelete) return

    setIsDeleting(true)
    try {
      const response = await StoryService.deleteStory(storyToDelete.id)

      if (!response.success) {
        throw new Error(response.message || "Failed to delete the story")
      }

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
  filteredWorks.sort((a, b) => {
    const aDate = a.lastEdited ? new Date(a.lastEdited).getTime() : 0;
    const bDate = b.lastEdited ? new Date(b.lastEdited).getTime() : 0;
    return bDate - aDate;
  })

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-semibold">My Works</h1>

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
        </div>
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
  onDeleteStory: (story: { id: string, title: string }) => void
}

function WorksContent({ works, searchQuery, isLoading, onDeleteStory }: WorksContentProps) {
  const router = useRouter()

  const handleContinueEditing = (storyId: string) => {
    router.push(`/write/story-info?id=${storyId}`)
  }

  const handleViewStory = (_storyId: string, slug: string) => {
    router.push(`/story/${slug}`)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={`skeleton-${index}`}>
            <StoryCardSkeleton variant="portrait-grid" />
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
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
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
          <StoryCard
            story={{
              id: work.id,
              title: work.title,
              author: work.author || "Me",
              genre: work.genre,
              coverImage: ImageService.getImageUrl(work.coverImage) || "/placeholder.svg",
              status: work.status,
              publishedChapters: work.publishedChapters,
              scheduledChapters: work.scheduledChapters,
              draftChapters: work.draftChapters,
              lastEdited: work.lastEdited,
              viewCount: work.viewCount,
              likeCount: work.likeCount,
              commentCount: work.commentCount,
              chapterCount: work.publishedChapters,
              slug: work.slug,
              isMature: work.isMature,
            }}
            variant="portrait-work"
            onEdit={handleContinueEditing}
            onView={(id, slug) => handleViewStory(id, slug || "")}
            onDelete={onDeleteStory}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
