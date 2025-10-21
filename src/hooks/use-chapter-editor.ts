"use client"

import { useState, useEffect } from 'react'
import { StoryService } from '@/services/story-service'
import { Chapter, CreateChapterRequest, UpdateChapterRequest } from '@/types/story'
import { logInfo, logError, logWarning } from '@/lib/error-logger'
import { useToast } from '@/components/ui/use-toast'
import { calculateWordCount } from "@/lib/editor-utils"

// Types for chapter data
export interface ChapterData {
  id: string
  title: string
  content: string
  number: number
  wordCount: number
  lastSaved: Date | null
  status: "draft" | "published" | "scheduled"
  isPremium: boolean // Keeping this for compatibility with API
}

// Types for publish settings
export interface PublishSettings {
  schedulePublish: boolean
  publishDate: Date
}

export interface UseChapterEditorProps {
  storyId: string
  chapterId: string
  onSaveSuccess?: (chapter: Chapter) => void
  onPublishSuccess?: () => void
}

export interface UseChapterEditorReturn {
  chapter: ChapterData
  setChapter: React.Dispatch<React.SetStateAction<ChapterData>>
  hasChanges: boolean
  isSaving: boolean
  initialContent: string
  initialTitle: string
  initialIsDraft: boolean
  publishSettings: PublishSettings
  setPublishSettings: React.Dispatch<React.SetStateAction<PublishSettings>>
  handleEditorChange: (content: string) => void
  handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  saveChapter: (showToast?: boolean, forceDraft?: boolean, preserveStatus?: boolean) => Promise<Chapter | undefined>
  publishChapter: () => Promise<void>
  syncStateWithBackend: (savedChapter: Chapter) => void
  isNewChapter: boolean
  stateVersion: number
}

export function useChapterEditor({
  storyId,
  chapterId,
  onSaveSuccess,
  onPublishSuccess
}: UseChapterEditorProps): UseChapterEditorReturn {
  const { toast } = useToast()
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
    isPremium: false // Keeping this for compatibility with API
  })

  // Track original content, title, and draft status
  const [initialContent, setInitialContent] = useState<string>("")
  const [initialTitle, setInitialTitle] = useState<string>("")
  const [initialIsDraft, setInitialIsDraft] = useState<boolean>(true)

  // Track if content has actually changed
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // State version for tracking changes
  const [stateVersion, setStateVersion] = useState(0)

  // REMOVED: Auto-save backoff mechanism
  // Auto-save has been removed to reduce unnecessary database pings

  // Publishing settings
  const [publishSettings, setPublishSettings] = useState<PublishSettings>({
    schedulePublish: false,
    publishDate: new Date()
  })

  // REMOVED: Debounced chapter for auto-save
  // Auto-save has been removed - users now manually save

  // Function to synchronize state with backend after save
  const syncStateWithBackend = (savedChapter: Chapter) => {
    logInfo('Syncing state with backend', { chapterId: savedChapter.id })

    // Update local state with saved data
    setChapter(prev => ({
      ...prev,
      id: savedChapter.id,
      lastSaved: new Date(savedChapter.updatedAt),
      wordCount: savedChapter.wordCount,
      status: savedChapter.status
    }))

    // Reset changes flag after successful save
    setHasChanges(false)

    // Update initial values to match current values after saving
    setInitialContent(chapter.content)
    setInitialTitle(chapter.title)
    setInitialIsDraft(savedChapter.status === 'draft')

    // REMOVED: Auto-save backoff reset
  }

  // Load chapter data if editing an existing chapter
  useEffect(() => {
    if (isNewChapter || !storyId) return

    // Fetch chapter from API
    const fetchChapter = async () => {
      try {
        logInfo('Fetching chapter data', { storyId, chapterId })
        const chapterData = await StoryService.getChapter(storyId, chapterId)

        // Convert to our local state format
        setChapter({
          id: chapterData.id,
          title: chapterData.title,
          content: chapterData.content || "",
          number: chapterData.number,
          wordCount: chapterData.wordCount,
          lastSaved: new Date(chapterData.updatedAt),
          status: chapterData.status, // Use the status field directly
          isPremium: chapterData.isPremium
        })

        // Store initial content, title, and draft status to track changes
        setInitialContent(chapterData.content || "")
        setInitialTitle(chapterData.title)
        setInitialIsDraft(chapterData.status === 'draft')
        
        // Reset hasChanges flag when loading existing chapter
        setHasChanges(false)

        // Initialize publish settings
        setPublishSettings(prev => ({
          ...prev
        }))

      } catch (error) {
        logError(error, {
          context: 'fetchChapter',
          storyId,
          chapterId
        })

        toast({
          title: "Error loading chapter",
          description: "Failed to load chapter data. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchChapter()
  }, [isNewChapter, storyId, chapterId, toast])

  // Get the next chapter number if creating a new chapter
  useEffect(() => {
    if (!isNewChapter || !storyId) return

    const fetchNextChapterNumber = async () => {
      try {
        // Get all chapters for the story
        const chapters = await StoryService.getChapters(storyId)

        // Find the highest chapter number
        const highestNumber = chapters.length > 0
          ? Math.max(...chapters.map(c => c.number))
          : 0

        // Set the next chapter number
        const nextNumber = highestNumber + 1

        // Update chapter with next number and default title
        setChapter(prev => ({
          ...prev,
          number: nextNumber,
          title: `Chapter ${nextNumber}`
        }))

        // Set initial title to match
        setInitialTitle(`Chapter ${nextNumber}`)

      } catch (error) {
        logError(error, {
          context: 'fetchNextChapterNumber',
          storyId
        })

        // Default to chapter 1 if we can't determine the next number
        setChapter(prev => ({
          ...prev,
          number: 1,
          title: "Chapter 1"
        }))

        setInitialTitle("Chapter 1")
      }
    }

    fetchNextChapterNumber()
  }, [isNewChapter, storyId])



  // Handle editor content change
  const handleEditorChange = (content: string) => {
    // Calculate word count (strip HTML tags first)
    const wordCount = calculateWordCount(content)

    // Only update if content has actually changed
    if (content !== chapter.content) {
      setStateVersion(prev => prev + 1)

      setChapter((prev) => ({
        ...prev,
        content,
        wordCount,
        lastSaved: null, // Mark as unsaved
      }))

      // Check if content has actually changed from initial state
      const contentChanged = content !== initialContent
      const titleChanged = chapter.title !== initialTitle

      if (contentChanged || titleChanged) {
        logInfo('Content or title changed, setting hasChanges', { contentChanged, titleChanged })
        setHasChanges(true)
      } else {
        // If we're back to the initial state, mark as no changes
        setHasChanges(false)
      }
    }
  }

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only update if title has actually changed
    if (e.target.value !== chapter.title) {
      setStateVersion(prev => prev + 1)

      setChapter((prev) => ({
        ...prev,
        title: e.target.value,
        lastSaved: null, // Mark as unsaved
      }))

      // Check if title has actually changed from initial state
      const titleChanged = e.target.value !== initialTitle
      const contentChanged = chapter.content !== initialContent

      if (titleChanged || contentChanged) {
        logInfo('Title or content changed, setting hasChanges', { titleChanged, contentChanged })
        setHasChanges(true)
      } else {
        // If we're back to the initial state, mark as no changes
        setHasChanges(false)
      }
    }
  }

  // Save chapter as draft or update existing chapter
  const saveChapter = async (showToast = true, forceDraft = false, preserveStatus = false): Promise<Chapter | undefined> => {
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
      // Determine if we should change the status
      let status: 'draft' | 'published' | 'scheduled'

      if (preserveStatus && chapter.status) {
        // When preserveStatus is true, keep the current status
        status = chapter.status
      } else if (forceDraft) {
        // When forceDraft is true, always save as draft
        status = 'draft'
      } else if (hasChanges && initialIsDraft) {
        // If there are changes and it was originally a draft, keep as draft
        status = 'draft'
      } else {
        // Otherwise, preserve the original status or default to published
        status = chapter.status || 'published'
      }

      // Only include status in the API request if we're explicitly changing it
      // or if this is a new chapter (which should default to draft)
      const statusField = (showToast && !preserveStatus) || isNewChapter || !chapter.id
        ? { status: isNewChapter ? 'draft' : status }
        : {}

      // Prepare chapter data for API
      const chapterData: CreateChapterRequest = {
        title: chapter.title,
        content: chapter.content,
        number: chapter.number,
        isPremium: chapter.isPremium,
        ...statusField
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
        logInfo('Updating existing chapter', {
          storyId,
          chapterId: chapter.id,
          wordCount: chapter.wordCount,
          status: statusField.status
        })

        savedChapter = await StoryService.updateChapter(storyId, chapter.id, chapterData)
      }

      // Update local state with saved data
      syncStateWithBackend(savedChapter)

      // Show success toast if requested
      if (showToast) {
        toast({
          title: "Chapter saved",
          description: "Your chapter has been saved successfully.",
        })
      }

      // Call the onSaveSuccess callback if provided
      if (onSaveSuccess) {
        onSaveSuccess(savedChapter)
      }

      return savedChapter
    } catch (error) {
      logError(error, {
        context: 'saveChapter',
        storyId,
        chapterId: chapter.id,
        isNewChapter,
        forceDraft
      })

      if (showToast) {
        toast({
          title: "Error saving chapter",
          description: "Failed to save your chapter. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Publish chapter
  const publishChapter = async (): Promise<void> => {
    if (isSaving) return

    setIsSaving(true)

    try {
      // Format the date for API consumption
      let formattedDate = undefined;
      if (publishSettings.schedulePublish) {
        // Create a string in ISO format but without milliseconds and timezone
        // This format is more compatible with database datetime fields
        const date = publishSettings.publishDate;
        formattedDate = date.toISOString().split('.')[0] + 'Z';
      }

      // Save chapter with publishing status
      const chapterData: UpdateChapterRequest = {
        title: chapter.title,
        content: chapter.content,
        number: chapter.number,
        status: publishSettings.schedulePublish ? 'scheduled' : 'published', // Set appropriate status
        publishDate: formattedDate ? new Date(formattedDate) : undefined
      }

      logInfo('Publishing chapter', {
        storyId,
        chapterId: chapter.id,
        schedulePublish: publishSettings.schedulePublish,
        publishDate: formattedDate
      })

      const savedChapter = await StoryService.updateChapter(storyId, chapter.id, chapterData)

      // Update local state
      syncStateWithBackend(savedChapter)

      // Show success toast
      toast({
        title: "Chapter published",
        description: "Your chapter has been published successfully.",
      })

      // Call the onPublishSuccess callback if provided
      if (onPublishSuccess) {
        onPublishSuccess()
      }
    } catch (error) {
      logError(error, {
        context: 'publishChapter',
        storyId,
        chapterId: chapter.id
      })

      toast({
        title: "Error publishing chapter",
        description: "Failed to publish your chapter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // REMOVED: Auto-save effect
  // Auto-save has been removed to reduce unnecessary database pings.
  // Users now manually save using the "Save Draft" button or Ctrl/Cmd+S keyboard shortcut.

  // Log component lifecycle for debugging
  useEffect(() => {
    logInfo('ChapterEditor hook initialized', {
      storyId,
      chapterId,
      isNewChapter
    })

    return () => {
      if (hasChanges) {
        logWarning('ChapterEditor hook unmounted with unsaved changes', {
          storyId,
          chapterId
        })
      }
    }
  }, [])

  return {
    chapter,
    setChapter,
    hasChanges,
    isSaving,
    initialContent,
    initialTitle,
    initialIsDraft,
    publishSettings,
    setPublishSettings,
    handleEditorChange,
    handleTitleChange,
    saveChapter,
    publishChapter,
    syncStateWithBackend,
    isNewChapter,
    stateVersion
  }
}
