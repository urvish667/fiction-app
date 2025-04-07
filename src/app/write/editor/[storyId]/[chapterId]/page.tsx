"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, Eye, Clock, Check, Calendar, Bell, Globe, Lock, FileText, BookOpen } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { Editor } from "@/components/editor"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { StoryService } from "@/services/story-service"
import { Chapter } from "@/types/story"

// Types for chapter data
interface ChapterData {
  id: string
  title: string
  content: string
  number: number
  wordCount: number
  lastSaved: Date | null
  status: "draft" | "published" | "scheduled"
  isPremium: boolean
}

export default function ChapterEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const storyId = params?.storyId as string
  const chapterId = params?.chapterId as string
  const isNewChapter = chapterId === "new-chapter"

  // State for chapter data
  const [chapter, setChapter] = useState<ChapterData>({
    id: isNewChapter ? "" : chapterId,
    title: "",
    content: "",
    number: 1,
    wordCount: 0,
    lastSaved: null,
    status: "draft",
    isPremium: false
  })

  // Track if content has actually changed to avoid unnecessary saves
  const [hasChanges, setHasChanges] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const [publishSettings, setPublishSettings] = useState({
    visibility: "public",
    schedulePublish: false,
    publishDate: new Date(),
    notifyFollowers: true,
    isPremium: false,
    markStoryCompleted: false
  })

  // State for story metadata (needed for navigation and publishing)

  // Create debounced version of chapter for auto-save
  const debouncedChapter = useDebounce(chapter, 1500)

  // Get the session for authentication
  const { data: session } = useSession()

  // Check authentication
  useEffect(() => {
    if (!session) {
      // Redirect to login if not authenticated
      router.push(`/login?callbackUrl=/write/editor/${storyId}/${chapterId}`)
    }
  }, [session, router, storyId, chapterId])

  // Load story metadata
  useEffect(() => {
    if (!storyId || !session) return

    const fetchStory = async () => {
      try {
        const story = await StoryService.getStory(storyId)

        // Check if the user is the author
        if (story.authorId !== session.user.id) {
          toast({
            title: "Unauthorized",
            description: "You can only edit your own stories.",
            variant: "destructive",
          })
          router.push("/write/story-info")
          return
        }

        // Store story slug if needed in the future
        // const storySlug = story.slug
      } catch (error) {
        console.error("Failed to fetch story", error)
        toast({
          title: "Error loading story",
          description: "Failed to load story data. Please try again.",
          variant: "destructive",
        })
        router.push("/write/story-info")
      }
    }

    fetchStory()
  }, [storyId, session, router, toast])

  // Load chapter data if editing an existing chapter
  useEffect(() => {
    if (isNewChapter || !storyId || !session) return

    // Fetch chapter from API
    const fetchChapter = async () => {
      try {
        const chapterData = await StoryService.getChapter(storyId, chapterId)

        // Convert to our local state format
        setChapter({
          id: chapterData.id,
          title: chapterData.title,
          content: chapterData.content || "",
          number: chapterData.number,
          wordCount: chapterData.wordCount,
          lastSaved: new Date(chapterData.updatedAt),
          status: "published", // Default status, will be overridden below
          isPremium: chapterData.isPremium
        })

        // Set premium status in publish settings
        setPublishSettings(prev => ({
          ...prev,
          isPremium: chapterData.isPremium
        }))

      } catch (error) {
        console.error("Failed to load chapter", error)
        toast({
          title: "Error loading chapter",
          description: "Failed to load chapter data. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchChapter()
  }, [isNewChapter, storyId, chapterId, session, toast])

  // Get the next chapter number if creating a new chapter
  useEffect(() => {
    if (!isNewChapter || !storyId || !session) return

    const getNextChapterNumber = async () => {
      try {
        const chapters = await StoryService.getChapters(storyId)

        if (chapters.length > 0) {
          // Find the highest chapter number and add 1
          const highestNumber = Math.max(...chapters.map(c => c.number))
          setChapter(prev => ({
            ...prev,
            number: highestNumber + 1,
            title: `Chapter ${highestNumber + 1}`
          }))
        } else {
          // If no chapters, start with chapter 1
          setChapter(prev => ({
            ...prev,
            number: 1,
            title: "Chapter 1"
          }))
        }
      } catch (error) {
        console.error("Failed to determine chapter number", error)
        // Default to chapter 1 if we can't determine
        setChapter(prev => ({
          ...prev,
          number: 1,
          title: "Chapter 1"
        }))
      }
    }

    getNextChapterNumber()
  }, [isNewChapter, storyId, session])

  // Auto-save effect
  useEffect(() => {
    // Only auto-save if:
    // 1. We have a title and content
    // 2. We're not currently saving
    // 3. There are changes to save
    // 4. This is NOT a new chapter OR it's a new chapter that has been saved at least once (has an ID)
    if (debouncedChapter.title &&
        debouncedChapter.content &&
        !isSaving &&
        hasChanges &&
        (!isNewChapter || (isNewChapter && chapter.id))) {
      saveChapter(false)
    }
  }, [debouncedChapter, hasChanges, isNewChapter, chapter.id])

  // Handle editor content change
  const handleEditorChange = (content: string) => {
    // Calculate word count
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

    // Only update if content has actually changed
    if (content !== chapter.content) {
      setChapter((prev) => ({
        ...prev,
        content,
        wordCount,
        lastSaved: null, // Mark as unsaved
      }))
      setHasChanges(true)
    }
  }

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only update if title has actually changed
    if (e.target.value !== chapter.title) {
      setChapter((prev) => ({
        ...prev,
        title: e.target.value,
        lastSaved: null, // Mark as unsaved
      }))
      setHasChanges(true)
    }
  }

  // Save chapter as draft
  const saveChapter = async (showToast = true) => {
    if (isSaving) return

    // Validate input
    if (!chapter.title.trim()) {
      if (showToast) {
        toast({
          title: "Title required",
          description: "Please enter a title for your chapter.",
          variant: "destructive",
        })
      }
      return
    }

    setIsSaving(true)

    try {
      // Prepare chapter data for API
      const chapterData = {
        title: chapter.title,
        content: chapter.content,
        number: chapter.number,
        isPremium: chapter.isPremium,
        isDraft: true // Explicitly set as draft
      }

      let savedChapter: Chapter

      if (isNewChapter || !chapter.id) {
        // For new chapters, only create if this is a manual save (showToast is true)
        // This prevents auto-save from creating multiple chapters
        if (showToast) {
          // Create new chapter
          savedChapter = await StoryService.createChapter(storyId, chapterData)
        } else {
          // Skip auto-save for new chapters that haven't been manually saved yet
          setIsSaving(false)
          return
        }
      } else {
        // Update existing chapter
        savedChapter = await StoryService.updateChapter(storyId, chapter.id, chapterData)
      }

      // Ensure the story stays in draft mode
      await StoryService.updateStory(storyId, {
        isDraft: true
      })

      // Update local state with saved data
      setChapter(prev => ({
        ...prev,
        id: savedChapter.id,
        lastSaved: new Date(savedChapter.updatedAt),
        wordCount: savedChapter.wordCount,
        status: "draft" // Explicitly set status to draft
      }))

      // Reset changes flag after successful save
      setHasChanges(false)

      if (isNewChapter && savedChapter.id) {
        // If we just created a new chapter, update the URL to include the proper ID
        router.replace(`/write/editor/${storyId}/${savedChapter.id}`)
      }

      if (showToast) {
        toast({
          title: "Chapter saved",
          description: "Your chapter has been saved as a draft and is only visible to you.",
        })
      }
    } catch (error) {
      console.error("Failed to save chapter", error)
      if (showToast) {
        toast({
          title: "Save failed",
          description: error instanceof Error ? error.message : "Failed to save your chapter. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Handle publish settings change
  const handlePublishSettingsChange = (field: string, value: any) => {
    setPublishSettings((prev) => ({ ...prev, [field]: value }))
  }

  // Publish chapter
  const publishChapter = async () => {
    // Validate chapter
    if (!chapter.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your chapter.",
        variant: "destructive",
      })
      return
    }

    if (!chapter.content.trim()) {
      toast({
        title: "Content required",
        description: "Your chapter cannot be empty.",
        variant: "destructive",
      })
      return
    }

    // If marking the story as completed, check for draft chapters
    if (publishSettings.markStoryCompleted) {
      try {
        const chapters = await StoryService.getChapters(storyId);
        // Filter out the current chapter since it's being published
        const draftChapters = chapters.filter(ch => ch.isDraft && ch.id !== chapter.id);

        if (draftChapters.length > 0) {
          toast({
            title: "Cannot mark as completed",
            description: `This story has ${draftChapters.length} other draft ${draftChapters.length === 1 ? "chapter" : "chapters"}. Please publish all draft chapters before marking the story as completed.`,
            variant: "destructive",
          });
          return; // Don't publish with completed status
        }
      } catch (error) {
        console.error("Failed to check draft chapters:", error);
        toast({
          title: "Error",
          description: "Failed to check draft chapters. Please try again.",
          variant: "destructive",
        });
        return; // Don't publish with completed status
      }
    }

    setIsSaving(true)

    try {
      // Save chapter first with any premium status changes
      const chapterData = {
        title: chapter.title,
        content: chapter.content,
        number: chapter.number,
        isPremium: publishSettings.isPremium,
        isDraft: false, // Mark as published
        publishDate: publishSettings.schedulePublish ? publishSettings.publishDate : undefined
      }

      const savedChapter = await StoryService.updateChapter(storyId, chapter.id, chapterData)

      // Update the story status based on settings
      await StoryService.updateStory(storyId, {
        isDraft: false,
        status: publishSettings.markStoryCompleted ? "completed" : "ongoing"
      })

      // Update local state
      setChapter(prev => ({
        ...prev,
        lastSaved: new Date(savedChapter.updatedAt),
        status: publishSettings.schedulePublish ? "scheduled" : "published",
        isPremium: publishSettings.isPremium
      }))

      toast({
        title: publishSettings.schedulePublish ? "Chapter scheduled" : "Chapter published",
        description: publishSettings.schedulePublish
          ? `Your chapter will be published on ${format(publishSettings.publishDate, "PPP")}.`
          : "Your chapter has been published successfully!",
      })

      // Close dialog
      setIsPublishDialogOpen(false)

      // Redirect back to story info after a short delay
      setTimeout(() => {
        router.push(`/write/story-info?id=${storyId}`)
      }, 1500)
    } catch (error) {
      console.error("Failed to publish chapter", error)
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Failed to publish your chapter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Editor Navbar */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/write/story-info?id=${storyId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Story
            </Button>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <Input
              value={chapter.title}
              onChange={handleTitleChange}
              placeholder="Chapter Title"
              className="border-none text-center font-medium focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <span className={`text-sm flex items-center gap-1 ${chapter.status === "draft" ? "text-yellow-500" : "text-green-500"}`}>
              {chapter.status === "draft" ? (
                <>
                  <FileText size={14} />
                  <span>Draft</span>
                </>
              ) : (
                <>
                  <BookOpen size={14} />
                  <span>Published</span>
                </>
              )}
            </span>

            {/* Auto-save indicator */}
            {isSaving ? (
              <span className="text-sm text-muted-foreground animate-pulse">Saving...</span>
            ) : chapter.lastSaved ? (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock size={14} />
                Saved {new Date(chapter.lastSaved).toLocaleTimeString()}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Unsaved changes</span>
            )}

            <Button
              variant="outline"
              onClick={() => saveChapter(true)}
              disabled={isSaving}
              className="flex items-center gap-2"
              title="Save as draft (only visible to you)"
            >
              <Save size={16} />
              Save Draft
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              <Eye size={16} />
              {showPreview ? "Edit" : "Preview"}
            </Button>

            <Button
              onClick={() => setIsPublishDialogOpen(true)}
              className="flex items-center gap-2"
              disabled={!chapter.id}
              title="Publish chapter (visible to all readers)"
            >
              <Check size={16} />
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Main Editor Area */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Editor content={chapter.content} onChange={handleEditorChange} readOnly={showPreview} />
      </main>

      {/* Publish Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Publish Chapter</DialogTitle>
            <DialogDescription>
              Publishing will make this chapter visible to all readers.
              Choose your publishing options below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={publishSettings.visibility}
                onValueChange={(value) => handlePublishSettingsChange("visibility", value)}
              >
                <SelectTrigger id="visibility" className="flex items-center gap-2">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe size={16} />
                      <span>Public - Visible to everyone</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock size={16} />
                      <span>Private - Only visible to you</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPremium"
                  checked={publishSettings.isPremium}
                  onCheckedChange={(checked) => handlePublishSettingsChange("isPremium", checked === true)}
                />
                <Label htmlFor="isPremium" className="text-sm">
                  Premium Content (only for subscribers)
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="markStoryCompleted"
                  checked={publishSettings.markStoryCompleted}
                  onCheckedChange={(checked) => handlePublishSettingsChange("markStoryCompleted", checked === true)}
                />
                <Label htmlFor="markStoryCompleted" className="text-sm">
                  Mark story as completed
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                This will mark the entire story as completed. All chapters must be published (no drafts allowed).
                Readers will know the story is finished.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedulePublish"
                  checked={publishSettings.schedulePublish}
                  onCheckedChange={(checked) => handlePublishSettingsChange("schedulePublish", checked === true)}
                />
                <Label htmlFor="schedulePublish" className="text-sm">
                  Schedule for later
                </Label>
              </div>
            </div>

            {publishSettings.schedulePublish && (
              <div className="space-y-2 pl-6 border-l-2 border-muted">
                <Label htmlFor="publishDate">Publication Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <Calendar size={16} className="mr-2" />
                      {format(publishSettings.publishDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={publishSettings.publishDate}
                      onSelect={(date) => handlePublishSettingsChange("publishDate", date || new Date())}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyFollowers"
                checked={publishSettings.notifyFollowers}
                onCheckedChange={(checked) => handlePublishSettingsChange("notifyFollowers", checked === true)}
              />
              <Label htmlFor="notifyFollowers" className="text-sm flex items-center gap-2">
                <Bell size={16} />
                Notify followers when published
              </Label>
            </div>

            <div className="bg-muted/30 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Check size={16} className="text-green-500" />
                <span className="font-medium">Publishing checklist:</span>
              </div>
              <ul className="space-y-1 text-sm pl-6 list-disc">
                <li>Proofread your chapter for spelling and grammar</li>
                <li>Check formatting and paragraph breaks</li>
                <li>Ensure all links and images work correctly</li>
                <li>Preview your chapter to see how it will appear to readers</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={publishChapter} disabled={isSaving}>
              {publishSettings.schedulePublish ? "Schedule" : "Publish Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}