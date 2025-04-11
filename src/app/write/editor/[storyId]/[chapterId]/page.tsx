"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, Eye, Clock, Check, Bell, Globe, Lock, FileText, BookOpen, Menu } from "lucide-react"
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
import { format } from "date-fns"
import { StoryService } from "@/services/story-service"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useChapterEditor } from "@/hooks/use-chapter-editor"
import { logError } from "@/lib/error-logger"


export default function ChapterEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const storyId = params?.storyId as string
  const chapterId = params?.chapterId as string

  // Get the session for authentication
  const { data: session } = useSession()

  // State for UI elements
  const [showPreview, setShowPreview] = useState(false)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)

  // Use our custom hook for chapter editing functionality
  const {
    chapter,
    hasChanges,
    isSaving,
    publishSettings,
    setPublishSettings,
    handleEditorChange,
    handleTitleChange,
    saveChapter,
    publishChapter,
    isNewChapter
  } = useChapterEditor({
    storyId,
    chapterId,
    onSaveSuccess: (savedChapter) => {
      // If we just created a new chapter, update the URL to include the proper ID
      if (isNewChapter && savedChapter.id) {
        router.replace(`/write/editor/${storyId}/${savedChapter.id}`)
      }
    },
    onPublishSuccess: () => {
      // Redirect back to story info after a short delay
      setTimeout(() => {
        router.push(`/write/story-info?id=${storyId}`)
      }, 1500)
    }
  })

  // Extended publish settings for UI only
  const [extendedSettings, setExtendedSettings] = useState({
    visibility: "public",
    notifyFollowers: true
  })

  // Check authentication
  useEffect(() => {
    if (!session) {
      // Redirect to login if not authenticated
      router.push(`/login?callbackUrl=/write/editor/${storyId}/${chapterId}`)
    }
  }, [session, router, storyId, chapterId])

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveChapter(true, true)
      }

      // Ctrl/Cmd + P to preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setShowPreview(!showPreview)
      }

      // Escape to exit preview mode
      if (e.key === 'Escape' && showPreview) {
        setShowPreview(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [saveChapter, showPreview])

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
        logError(error, { context: 'fetchStory', storyId })
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

  // Handle publish settings change
  const handlePublishSettingsChange = (field: string, value: any) => {
    if (field === 'schedulePublish' || field === 'publishDate') {
      // These fields are in the core publishSettings
      setPublishSettings(prev => ({ ...prev, [field]: value }))
    } else {
      // These fields are in the extended settings
      setExtendedSettings(prev => ({ ...prev, [field]: value }))
    }
  }

  // Validate chapter before publishing
  const validateBeforePublish = async (): Promise<boolean> => {
    // Validate chapter
    if (!chapter.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your chapter.",
        variant: "destructive",
      })
      return false
    }

    if (!chapter.content.trim()) {
      toast({
        title: "Content required",
        description: "Your chapter cannot be empty.",
        variant: "destructive",
      })
      return false
    }

    // Validate scheduled date and time if scheduling is enabled
    if (publishSettings.schedulePublish) {
      const now = new Date();
      if (publishSettings.publishDate <= now) {
        toast({
          title: "Invalid schedule",
          description: "Publication date and time must be in the future.",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  // Handle publish button click
  const handlePublish = async () => {
    if (await validateBeforePublish()) {
      await publishChapter()
      setIsPublishDialogOpen(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Editor Navbar */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 px-4 sm:px-8">
        <div className="container flex h-14 items-center justify-between">
          {/* Back button - always visible */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => {
                if (hasChanges) {
                  // Confirm before navigating away with unsaved changes
                  if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    router.push(`/write/story-info?id=${storyId}`)
                  }
                } else {
                  router.push(`/write/story-info?id=${storyId}`)
                }
              }}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
              size="sm"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Story</span>
            </Button>
          </div>

          {/* Chapter title - centered */}
          <div className="flex-1 max-w-[180px] sm:max-w-md mx-2 sm:mx-4">
            <Input
              value={chapter.title}
              onChange={handleTitleChange}
              placeholder="Chapter Title"
              className="border-none text-center font-medium focus-visible:ring-0 text-sm sm:text-base"
            />
          </div>

          {/* Status and save indicators - visible on all screens */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Status indicator - always visible */}
            <span className={`text-xs sm:text-sm flex items-center gap-1 ${chapter.status === "draft" ? "text-yellow-500" : "text-green-500"}`}>
              {chapter.status === "draft" ? (
                <>
                  <FileText size={14} />
                  <span className="hidden sm:inline">Draft</span>
                </>
              ) : (
                <>
                  <BookOpen size={14} />
                  <span className="hidden sm:inline">Published</span>
                </>
              )}
            </span>

            {/* Auto-save indicator - visible on larger screens */}
            <div className="hidden sm:block">
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
            </div>

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => saveChapter(true, true)}
                disabled={isSaving}
                className="flex items-center gap-2"
                title="Save as draft (only visible to you)"
                aria-label="Save as draft"
                aria-busy={isSaving}
              >
                <Save size={16} />
                Save Draft
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
                aria-label={showPreview ? "Switch to edit mode" : "Preview chapter"}
              >
                <Eye size={16} />
                {showPreview ? "Edit" : "Preview"}
              </Button>

              <Button
                onClick={() => setIsPublishDialogOpen(true)}
                className="flex items-center gap-2"
                disabled={!chapter.id}
                title="Publish chapter (visible to all readers)"
                aria-label="Publish chapter"
                aria-disabled={!chapter.id}
              >
                <Check size={16} />
                Publish
              </Button>
            </div>

            {/* Mobile action menu */}
            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                  <div className="flex flex-col gap-4 py-4">
                    <h3 className="text-lg font-medium">Chapter Actions</h3>

                    {/* Save status in mobile menu */}
                    <div className="text-sm text-muted-foreground">
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 animate-spin" />
                          Saving...
                        </span>
                      ) : chapter.lastSaved ? (
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Saved at {new Date(chapter.lastSaved).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Unsaved changes
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => saveChapter(true, true)}
                        disabled={isSaving}
                        className="flex items-center justify-start gap-2 w-full"
                      >
                        <Save size={16} />
                        Save Draft
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center justify-start gap-2 w-full"
                      >
                        <Eye size={16} />
                        {showPreview ? "Edit" : "Preview"}
                      </Button>

                      <Button
                        variant="default"
                        onClick={() => {
                          setIsPublishDialogOpen(true);
                        }}
                        disabled={!chapter.id}
                        className="flex items-center justify-start gap-2 w-full"
                      >
                        <Check size={16} />
                        Publish Chapter
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Editor Area */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
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
                value={extendedSettings.visibility}
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
              <div className="space-y-4 pl-6 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label htmlFor="publishDate">Publication Date</Label>
                  <Input
                    id="publishDate"
                    type="date"
                    value={format(publishSettings.publishDate, "yyyy-MM-dd")}
                    onChange={(e) => {
                      // Create a new date with the selected date but keep the current time
                      if (e.target.value) {
                        const currentDate = new Date(publishSettings.publishDate);
                        const newDate = new Date(e.target.value);
                        newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0);

                        // Only allow future dates
                        const now = new Date();
                        now.setHours(0, 0, 0, 0); // Set to start of day for date comparison

                        if (newDate >= now) {
                          handlePublishSettingsChange("publishDate", newDate);
                        } else {
                          toast({
                            title: "Invalid date",
                            description: "Publication date cannot be in the past.",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    min={format(new Date(), "yyyy-MM-dd")}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishTime">Publication Time</Label>
                  <Input
                    id="publishTime"
                    type="time"
                    value={format(publishSettings.publishDate, "HH:mm")}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const newDate = new Date(publishSettings.publishDate);
                        newDate.setHours(hours, minutes, 0, 0);

                        // Check if the combined date and time is in the future
                        const now = new Date();
                        const selectedDate = new Date(publishSettings.publishDate);
                        selectedDate.setHours(0, 0, 0, 0); // Start of the selected day
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Start of today

                        // If the selected date is today, ensure the time is in the future
                        if (selectedDate.getTime() === today.getTime() && newDate <= now) {
                          toast({
                            title: "Invalid time",
                            description: "Publication time must be in the future.",
                            variant: "destructive",
                          });
                        } else {
                          handlePublishSettingsChange("publishDate", newDate);
                        }
                      }
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyFollowers"
                checked={extendedSettings.notifyFollowers}
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
            <Button onClick={handlePublish} disabled={isSaving}>
              {publishSettings.schedulePublish ? "Schedule" : "Publish Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}