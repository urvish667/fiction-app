"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Editor } from "@/components/editor"
import { StoryService } from "@/services/story-service"
import { useChapterEditor } from "@/hooks/use-chapter-editor"
import { logError } from "@/lib/error-logger"
import { EditorHeader } from "@/components/editor/editor-header"
import { PublishDialog } from "@/components/editor/publish-dialog"


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

  // Extended publish settings for UI only
  const [extendedSettings, setExtendedSettings] = useState({
    notifyFollowers: true
  })

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
  const handlePublishSettingsChange = useCallback((field: string, value: any) => {
    if (field === 'schedulePublish' || field === 'publishDate') {
      // These fields are in the core publishSettings
      setPublishSettings(prev => ({ ...prev, [field]: value }))
    } else {
      // Only notifyFollowers is supported now that visibility is always public
      setExtendedSettings(prev => ({ ...prev, [field]: value }))
    }
  }, [setPublishSettings])

  // Validate chapter before publishing
  const validateBeforePublish = useCallback(async (): Promise<boolean> => {
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
  }, [chapter.content, chapter.title, publishSettings.publishDate, publishSettings.schedulePublish, toast])

  // Handle publish button click
  const handlePublish = useCallback(async () => {
    if (await validateBeforePublish()) {
      await publishChapter()
      setIsPublishDialogOpen(false)
    }
  }, [publishChapter, setIsPublishDialogOpen, validateBeforePublish])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Editor Header */}
      <EditorHeader
        chapter={chapter}
        storyId={storyId}
        hasChanges={hasChanges}
        isSaving={isSaving}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        setIsPublishDialogOpen={setIsPublishDialogOpen}
        handleTitleChange={handleTitleChange}
        saveChapter={saveChapter}
      />

      {/* Main Editor Area */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <Editor content={chapter.content} onChange={handleEditorChange} readOnly={showPreview} />
      </main>

      {/* Publish Dialog */}
      <PublishDialog
        isOpen={isPublishDialogOpen}
        setIsOpen={setIsPublishDialogOpen}
        publishSettings={publishSettings}
        extendedSettings={extendedSettings}
        handlePublishSettingsChange={handlePublishSettingsChange}
        handlePublish={handlePublish}
        isSaving={isSaving}
      />
    </div>
  )
}