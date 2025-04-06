"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, Eye, AlertCircle } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { Editor } from "@/components/editor"
import ChapterSidebar from "@/components/chapter-sidebar"
import { StoryService } from "@/services/story-service"
import { Story, Chapter } from "@/types/story"

// Types for local state
interface StoryMetadata {
  id: string
  title: string
  description: string
  genre: string
  language: string
  isMature: boolean
  coverImage: string
  isDraft: boolean
  lastSaved: Date | null
  slug: string
}

interface ChapterData {
  id: string
  title: string
  content: string
  number: number // Changed from order to match API
  lastSaved: Date | null
  wordCount?: number
  isPremium?: boolean
}

export default function StoryEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const storyId = params?.storyId as string

  // State for story and chapters
  const [storyMetadata, setStoryMetadata] = useState<StoryMetadata | null>(null)
  const [chapters, setChapters] = useState<ChapterData[]>([])
  const [activeChapter, setActiveChapter] = useState<ChapterData | null>(null)
  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [isAddingChapter, setIsAddingChapter] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Create debounced version of active chapter for auto-save
  const debouncedChapter = useDebounce(activeChapter, 1500)

  // Get the session for authentication
  const { data: session } = useSession();

  // Check authentication
  useEffect(() => {
    if (!session) {
      // Redirect to login if not authenticated
      router.push(`/login?callbackUrl=/write/editor/${storyId}`)
    }
  }, [session, router, storyId])

  // Load story data
  useEffect(() => {
    if (!storyId || !session?.user?.id) return

    const fetchStory = async () => {
      try {
        const story = await StoryService.getStory(storyId);

        // Check if the user is the author
        if (story.authorId !== session.user.id) {
          toast({
            title: "Unauthorized",
            description: "You can only edit your own stories.",
            variant: "destructive",
          });
          router.push("/write/story-info");
          return;
        }

        // Convert to our local state format
        setStoryMetadata({
          id: story.id,
          title: story.title,
          description: story.description || "",
          genre: story.genre || "",
          language: story.language || "English",
          isMature: story.isMature,
          coverImage: story.coverImage || "/placeholder.svg?height=600&width=400",
          isDraft: story.isDraft,
          lastSaved: new Date(story.updatedAt),
          slug: story.slug,
        });
      } catch (error) {
        console.error("Failed to fetch story", error);
        toast({
          title: "Error loading story",
          description: "Failed to load story data. Please try again.",
          variant: "destructive",
        });
        router.push("/write/story-info");
      }
    };

    fetchStory();

    // Load chapters from API
    const fetchChapters = async () => {
      try {
        const chaptersData = await StoryService.getChapters(storyId);

        // Convert to our local state format
        const formattedChapters = chaptersData.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          content: chapter.content || '',
          number: chapter.number,
          lastSaved: new Date(chapter.updatedAt),
          wordCount: chapter.wordCount,
          isPremium: chapter.isPremium
        }));

        setChapters(formattedChapters);

        // Set active chapter to the first one if available
        if (formattedChapters.length > 0) {
          // Sort chapters by number
          const sortedChapters = [...formattedChapters].sort((a, b) => a.number - b.number);
          setActiveChapter(sortedChapters[0]);
        } else {
          // Create a first chapter if none exist
          createFirstChapter();
        }
      } catch (error) {
        console.error("Failed to fetch chapters", error);
        // Create a first chapter if fetching fails
        createFirstChapter();
      }
    };

    fetchChapters();
  }, [storyId, router, toast, session?.user?.id])

  // Auto-save effect for active chapter
  useEffect(() => {
    if (debouncedChapter && debouncedChapter.content) {
      saveChapter(false)
    }
  }, [debouncedChapter])

  // Helper function to find the next available chapter number
  const getNextChapterNumber = async () => {
    // If we have chapters locally, find the highest number and add 1
    if (chapters.length > 0) {
      const highestNumber = Math.max(...chapters.map(chapter => chapter.number));
      return highestNumber + 1;
    }

    // If no chapters locally, try to get them from the API
    try {
      const chaptersData = await StoryService.getChapters(storyId);
      if (chaptersData.length > 0) {
        const highestNumber = Math.max(...chaptersData.map(chapter => chapter.number));
        return highestNumber + 1;
      }
    } catch (error) {
      console.error("Error fetching chapters for numbering:", error);
    }

    // If all else fails, start with chapter 1
    return 1;
  };

  // Create first chapter
  const createFirstChapter = async (retryCount = 0) => {
    try {
      // Get the next available chapter number
      const chapterNumber = await getNextChapterNumber();

      // Create a new chapter via API
      const newChapter = await StoryService.createChapter(storyId, {
        title: chapterNumber === 1 ? "Chapter 1" : `Chapter ${chapterNumber}`,
        content: "",
        number: chapterNumber,
        isPremium: false
      });

      // Format for local state
      const firstChapter: ChapterData = {
        id: newChapter.id,
        title: newChapter.title,
        content: newChapter.content,
        number: newChapter.number,
        lastSaved: new Date(newChapter.updatedAt),
        wordCount: newChapter.wordCount,
        isPremium: newChapter.isPremium
      };

      setChapters([firstChapter]);
      setActiveChapter(firstChapter);
    } catch (error) {
      console.error("Failed to create first chapter", error);

      // If we get a unique constraint error and haven't retried too many times, try again
      if (error instanceof Error &&
          error.message.includes("already exists") &&
          retryCount < 3) {
        console.log(`Retrying chapter creation (attempt ${retryCount + 1})`);
        // Wait a short time before retrying to avoid race conditions
        setTimeout(() => createFirstChapter(retryCount + 1), 500);
        return;
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create chapter. Please try again.",
        variant: "destructive",
      });
    }
  }

  // Handle editor content change
  const handleEditorChange = (content: string) => {
    if (!activeChapter) return

    setActiveChapter((prev) => {
      if (!prev) return null
      return {
        ...prev,
        content,
        lastSaved: null, // Mark as unsaved
      }
    })
  }

  // Save current chapter
  const saveChapter = async (showToast = true) => {
    if (!activeChapter || isSaving) return

    setIsSaving(true)

    try {
      // Save chapter to API
      const updatedChapterData = await StoryService.updateChapter(storyId, activeChapter.id, {
        title: activeChapter.title,
        content: activeChapter.content,
        number: activeChapter.number,
        isPremium: activeChapter.isPremium || false
      });

      // Format for local state
      const updatedChapter = {
        ...activeChapter,
        lastSaved: new Date(),
        wordCount: updatedChapterData.wordCount
      };

      // Update the chapters array
      const updatedChapters = chapters.map((chapter) =>
        chapter.id === activeChapter.id ? updatedChapter : chapter
      );

      // Update state
      setChapters(updatedChapters);
      setActiveChapter(updatedChapter);

      if (showToast) {
        toast({
          title: "Chapter saved",
          description: "Your chapter has been saved.",
        });
      }
    } catch (error) {
      console.error("Failed to save chapter", error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save your chapter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Add new chapter
  const addNewChapter = async (retryCount = 0) => {
    if (!newChapterTitle.trim()) {
      toast({
        title: "Chapter title required",
        description: "Please enter a title for the new chapter.",
        variant: "destructive",
      })
      return
    }

    try {
      // Get the next available chapter number
      const chapterNumber = await getNextChapterNumber();

      // Create new chapter via API
      const newChapterData = await StoryService.createChapter(storyId, {
        title: newChapterTitle,
        content: "",
        number: chapterNumber,
        isPremium: false
      });

      // Format for local state
      const newChapter: ChapterData = {
        id: newChapterData.id,
        title: newChapterData.title,
        content: newChapterData.content,
        number: newChapterData.number,
        lastSaved: new Date(newChapterData.updatedAt),
        wordCount: newChapterData.wordCount,
        isPremium: newChapterData.isPremium
      };

      // Add to chapters array
      const updatedChapters = [...chapters, newChapter];
      setChapters(updatedChapters);

      // Set as active chapter
      setActiveChapter(newChapter);

      // Reset form
      setNewChapterTitle("");
      setIsAddingChapter(false);

      toast({
        title: "Chapter added",
        description: `"${newChapterTitle}" has been added.`,
      });
    } catch (error) {
      console.error("Failed to create chapter", error);

      // If we get a unique constraint error and haven't retried too many times, try again
      if (error instanceof Error &&
          error.message.includes("already exists") &&
          retryCount < 3) {
        console.log(`Retrying chapter creation (attempt ${retryCount + 1})`);
        // Wait a short time before retrying to avoid race conditions
        setTimeout(() => addNewChapter(retryCount + 1), 500);
        return;
      }

      // Extract detailed error information if available
      let errorMessage = "Failed to create chapter. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;

        // Check for specific error types
        if (errorMessage.includes("already exists")) {
          // Chapter number conflict
          errorMessage = "A chapter with this number already exists. The system will automatically assign the next available number when you try again.";
        } else {
          // Try to parse JSON error details if present
          try {
            if (error.message.includes("Validation error") && error.cause) {
              const details = JSON.parse(String(error.cause));
              if (details.details && Array.isArray(details.details)) {
                errorMessage = details.details.map((err: any) => err.message).join(", ");
              }
            }
          } catch (e) {
            // If parsing fails, use the original error message
          }
        }
      }

      toast({
        title: "Failed to add chapter",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  // Delete chapter
  const deleteChapter = async (chapterId: string) => {
    // Don't allow deleting the only chapter
    if (chapters.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one chapter.",
        variant: "destructive",
      })
      return
    }

    try {
      // Delete chapter via API
      await StoryService.deleteChapter(storyId, chapterId);

      // Remove chapter from array
      const updatedChapters = chapters.filter((chapter) => chapter.id !== chapterId);

      // If we need to reorder chapters, we would need to update each chapter's number
      // This would require multiple API calls, which we'll skip for now
      // Instead, we'll just update the local state

      setChapters(updatedChapters);

      // If active chapter was deleted, set a new active chapter
      if (activeChapter?.id === chapterId) {
        // Sort chapters by number to ensure we select the first one
        const sortedChapters = [...updatedChapters].sort((a, b) => a.number - b.number);
        setActiveChapter(sortedChapters[0]);
      }

      toast({
        title: "Chapter deleted",
        description: "The chapter has been deleted.",
      });
    } catch (error) {
      console.error("Failed to delete chapter", error);
      toast({
        title: "Failed to delete chapter",
        description: error instanceof Error ? error.message : "Failed to delete chapter. Please try again.",
        variant: "destructive",
      });
    }
  }

  // Switch active chapter
  const switchChapter = (chapterId: string) => {
    // Save current chapter first
    if (activeChapter) {
      saveChapter(false)
    }

    // Find and set the new active chapter
    const newActiveChapter = chapters.find((chapter) => chapter.id === chapterId)
    if (newActiveChapter) {
      setActiveChapter(newActiveChapter)
    }
  }

  // Reorder chapters
  const reorderChapters = (startIndex: number, endIndex: number) => {
    const result = Array.from(chapters)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    // Update order property
    const reorderedChapters = result.map((chapter, index) => ({
      ...chapter,
      order: index + 1,
    }))

    setChapters(reorderedChapters)

    // Save to localStorage
    localStorage.setItem(`chapters_${storyId}`, JSON.stringify(reorderedChapters))
  }

  // Publish story
  const publishStory = async () => {
    // Validate story and chapters
    if (!storyMetadata) {
      toast({
        title: "Cannot publish",
        description: "Story metadata is missing.",
        variant: "destructive",
      })
      return
    }

    if (chapters.length === 0) {
      toast({
        title: "Cannot publish",
        description: "Your story must have at least one chapter.",
        variant: "destructive",
      })
      return
    }

    // Check if any chapter is empty
    const emptyChapters = chapters.filter((chapter) => !chapter.content.trim())
    if (emptyChapters.length > 0) {
      toast({
        title: "Cannot publish",
        description: `${emptyChapters.length} chapter(s) have no content.`,
        variant: "destructive",
      })
      return
    }

    // Confirm publishing
    if (!window.confirm("Are you sure you want to publish this story? Published stories will be visible to all users.")) {
      return
    }

    setIsPublishing(true)

    try {
      // Save all chapters first
      await saveChapter(false)

      // Update the story in the database to set isDraft to false
      const publishedStory = await StoryService.updateStory(storyId, {
        isDraft: false
      })

      // Log the published story details for debugging
      console.log("Published story:", publishedStory)

      // Update local state
      setStoryMetadata({
        ...storyMetadata,
        isDraft: false,
        lastSaved: new Date(),
        slug: publishedStory.slug // Make sure we have the latest slug
      })

      toast({
        title: "Story published",
        description: "Your story has been published successfully!",
      })

      // Redirect to story page using the slug from the API response
      setTimeout(() => {
        router.push(`/story/${publishedStory.slug}`)
      }, 1500)
    } catch (error) {
      console.error("Failed to publish story", error)
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Failed to publish your story. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // If no story metadata, show loading
  if (!storyMetadata) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Editor Navbar */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 px-8">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/write/story-info")}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Story Info
            </Button>

            <h1 className="text-lg font-medium truncate max-w-[200px] md:max-w-md">{storyMetadata.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-save indicator */}
            {isSaving ? (
              <span className="text-sm text-muted-foreground animate-pulse">Saving...</span>
            ) : activeChapter?.lastSaved ? (
              <span className="text-sm text-muted-foreground">
                Saved {new Date(activeChapter.lastSaved).toLocaleTimeString()}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Unsaved changes</span>
            )}

            <Button
              variant="outline"
              onClick={() => saveChapter(true)}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Save
            </Button>

            <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2">
              <Eye size={16} />
              {showPreview ? "Edit" : "Preview"}
            </Button>

            <Button onClick={publishStory} disabled={isPublishing} className="flex items-center gap-2">
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Chapter Sidebar */}
        <ChapterSidebar
          chapters={chapters}
          activeChapterId={activeChapter?.id || ""}
          onChapterSelect={switchChapter}
          onChapterDelete={deleteChapter}
          onChapterReorder={reorderChapters}
          onAddChapter={() => setIsAddingChapter(true)}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main Editor Area */}
        <main className="flex-1 overflow-auto">
          {activeChapter ? (
            <div className="container py-6 px-8">
              {/* Chapter Title */}
              <div className="mb-6">
                <Input
                  value={activeChapter.title}
                  onChange={(e) => {
                    setActiveChapter({
                      ...activeChapter,
                      title: e.target.value,
                      lastSaved: null,
                    })
                  }}
                  placeholder="Chapter Title"
                  className="text-xl font-bold border-none px-4 text-2xl focus-visible:ring-0"
                />
              </div>

              {/* Editor */}
              <Editor content={activeChapter.content} onChange={handleEditorChange} readOnly={showPreview} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 text-lg font-medium">No chapter selected</h2>
                <p className="text-muted-foreground">Select a chapter from the sidebar or create a new one.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Chapter Dialog */}
      <Dialog open={isAddingChapter} onOpenChange={setIsAddingChapter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Chapter</DialogTitle>
            <DialogDescription>Enter a title for your new chapter.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Chapter Title"
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingChapter(false)}>
              Cancel
            </Button>
            <Button onClick={addNewChapter}>Add Chapter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

