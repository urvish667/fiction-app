"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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

// Types for story and chapter data
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
}

interface ChapterData {
  id: string
  title: string
  content: string
  order: number
  lastSaved: Date | null
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

  // Load story data
  useEffect(() => {
    if (!storyId) return

    // In a real app, we would fetch from API
    // For this demo, we'll use localStorage
    const savedStory = localStorage.getItem("draftStory")
    if (savedStory) {
      try {
        const parsedStory = JSON.parse(savedStory)
        if (parsedStory.id === storyId) {
          setStoryMetadata(parsedStory)
        } else {
          // Story ID mismatch
          toast({
            title: "Story not found",
            description: "The requested story could not be found.",
            variant: "destructive",
          })
          router.push("/write/story-info")
        }
      } catch (error) {
        console.error("Failed to parse saved story", error)
        toast({
          title: "Error loading story",
          description: "Failed to load story data. Please try again.",
          variant: "destructive",
        })
        router.push("/write/story-info")
      }
    } else {
      // No saved story
      toast({
        title: "Story not found",
        description: "The requested story could not be found.",
        variant: "destructive",
      })
      router.push("/write/story-info")
    }

    // Load chapters
    const savedChapters = localStorage.getItem(`chapters_${storyId}`)
    if (savedChapters) {
      try {
        const parsedChapters = JSON.parse(savedChapters)
        setChapters(parsedChapters)

        // Set active chapter to the first one if available
        if (parsedChapters.length > 0) {
          setActiveChapter(parsedChapters[0])
        } else {
          // Create a first chapter if none exist
          createFirstChapter()
        }
      } catch (error) {
        console.error("Failed to parse saved chapters", error)
        // Create a first chapter if parsing fails
        createFirstChapter()
      }
    } else {
      // No saved chapters, create the first one
      createFirstChapter()
    }
  }, [storyId, router, toast])

  // Auto-save effect for active chapter
  useEffect(() => {
    if (debouncedChapter && debouncedChapter.content) {
      saveChapter(false)
    }
  }, [debouncedChapter])

  // Create first chapter
  const createFirstChapter = () => {
    const firstChapter: ChapterData = {
      id: `chapter_${Date.now()}`,
      title: "Chapter 1",
      content: "",
      order: 1,
      lastSaved: null,
    }

    setChapters([firstChapter])
    setActiveChapter(firstChapter)

    // Save to localStorage
    localStorage.setItem(`chapters_${storyId}`, JSON.stringify([firstChapter]))
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
      // Update the chapter in the chapters array
      const updatedChapter = {
        ...activeChapter,
        lastSaved: new Date(),
      }

      const updatedChapters = chapters.map((chapter) => (chapter.id === activeChapter.id ? updatedChapter : chapter))

      // Update state
      setChapters(updatedChapters)
      setActiveChapter(updatedChapter)

      // Save to localStorage
      localStorage.setItem(`chapters_${storyId}`, JSON.stringify(updatedChapters))

      if (showToast) {
        toast({
          title: "Chapter saved",
          description: "Your chapter has been saved.",
        })
      }
    } catch (error) {
      console.error("Failed to save chapter", error)
      toast({
        title: "Save failed",
        description: "Failed to save your chapter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Add new chapter
  const addNewChapter = () => {
    if (!newChapterTitle.trim()) {
      toast({
        title: "Chapter title required",
        description: "Please enter a title for the new chapter.",
        variant: "destructive",
      })
      return
    }

    // Create new chapter
    const newChapter: ChapterData = {
      id: `chapter_${Date.now()}`,
      title: newChapterTitle,
      content: "",
      order: chapters.length + 1,
      lastSaved: null,
    }

    // Add to chapters array
    const updatedChapters = [...chapters, newChapter]
    setChapters(updatedChapters)

    // Set as active chapter
    setActiveChapter(newChapter)

    // Save to localStorage
    localStorage.setItem(`chapters_${storyId}`, JSON.stringify(updatedChapters))

    // Reset form
    setNewChapterTitle("")
    setIsAddingChapter(false)

    toast({
      title: "Chapter added",
      description: `"${newChapterTitle}" has been added.`,
    })
  }

  // Delete chapter
  const deleteChapter = (chapterId: string) => {
    // Don't allow deleting the only chapter
    if (chapters.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one chapter.",
        variant: "destructive",
      })
      return
    }

    // Remove chapter from array
    const updatedChapters = chapters.filter((chapter) => chapter.id !== chapterId)

    // Reorder remaining chapters
    const reorderedChapters = updatedChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1,
    }))

    setChapters(reorderedChapters)

    // If active chapter was deleted, set a new active chapter
    if (activeChapter?.id === chapterId) {
      setActiveChapter(reorderedChapters[0])
    }

    // Save to localStorage
    localStorage.setItem(`chapters_${storyId}`, JSON.stringify(reorderedChapters))

    toast({
      title: "Chapter deleted",
      description: "The chapter has been deleted.",
    })
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

    setIsPublishing(true)

    try {
      // Save all chapters first
      await saveChapter(false)

      // In a real app, we would send to an API
      // For this demo, we'll just update the draft status
      const publishedStory = {
        ...storyMetadata,
        isDraft: false,
        lastSaved: new Date(),
      }

      // Save to localStorage
      localStorage.setItem("draftStory", JSON.stringify(publishedStory))

      // Update state
      setStoryMetadata(publishedStory)

      toast({
        title: "Story published",
        description: "Your story has been published successfully!",
      })

      // Redirect to story page
      setTimeout(() => {
        router.push(`/story/${storyId}`)
      }, 1500)
    } catch (error) {
      console.error("Failed to publish story", error)
      toast({
        title: "Publish failed",
        description: "Failed to publish your story. Please try again.",
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

