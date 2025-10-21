"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Eye, Clock, Check, FileText, BookOpen, Menu, AlertTriangle } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ChapterData } from "@/hooks/use-chapter-editor"

interface EditorHeaderProps {
  chapter: ChapterData
  storyId: string
  hasChanges: boolean
  isSaving: boolean
  showPreview: boolean
  setShowPreview: (show: boolean) => void
  setIsPublishDialogOpen: (open: boolean) => void
  handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  saveChapter: (showToast?: boolean, forceDraft?: boolean, preserveStatus?: boolean) => Promise<any>
}

export const EditorHeader = React.memo(function EditorHeader({
  chapter,
  storyId,
  hasChanges,
  isSaving,
  showPreview,
  setShowPreview,
  setIsPublishDialogOpen,
  handleTitleChange,
  saveChapter
}: EditorHeaderProps) {
  const router = useRouter()

  // Handle back button click with confirmation if there are unsaved changes
  const handleBackClick = () => {
    if (hasChanges) {
      // Confirm before navigating away with unsaved changes
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(`/write/story-info?id=${storyId}`)
      }
    } else {
      router.push(`/write/story-info?id=${storyId}`)
    }
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 px-4 sm:px-8">
      <div className="container flex h-14 items-center justify-between">
        {/* Back button - always visible */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={handleBackClick}
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
            aria-label="Chapter title"
          />
        </div>

        {/* Status and save indicators - visible on all screens */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Status indicator - always visible */}
          <span className={`text-xs sm:text-sm flex items-center gap-1 ${
            chapter.status === "draft" ? "text-yellow-500" : 
            chapter.status === "scheduled" ? "text-orange-500" : 
            "text-green-500"
          }`}>
            {chapter.status === "draft" ? (
              <>
                <FileText size={14} />
                <span className="hidden sm:inline">Draft</span>
              </>
            ) : chapter.status === "scheduled" ? (
              <>
                <Clock size={14} />
                <span className="hidden sm:inline">Scheduled</span>
              </>
            ) : (
              <>
                <BookOpen size={14} />
                <span className="hidden sm:inline">Published</span>
              </>
            )}
          </span>

          {/* Save status indicator - visible on larger screens */}
          <div className="hidden sm:block">
            {isSaving ? (
              <span className="text-sm text-muted-foreground animate-pulse flex items-center gap-1">
                <Clock size={14} className="animate-spin" />
                Saving...
              </span>
            ) : hasChanges ? (
              <span className="text-sm text-yellow-600 dark:text-yellow-500 flex items-center gap-1 font-medium">
                <AlertTriangle size={14} />
                Unsaved changes
              </span>
            ) : chapter.lastSaved ? (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock size={14} />
                Saved {new Date(chapter.lastSaved).toLocaleTimeString()}
              </span>
            ) : null}
          </div>

          {/* Desktop buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {chapter.status === "published" || chapter.status === "scheduled" ? (
              <Button
                variant="outline"
                size="icon"
                onClick={() => saveChapter(true, false, true)}
                disabled={isSaving}
                className="h-9 w-9 rounded-full"
                title={chapter.status === "scheduled" ? "Update scheduled chapter" : "Update published chapter"}
                aria-label="Update chapter"
                aria-busy={isSaving}
              >
                <Save size={16} />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={() => saveChapter(true, true)}
                disabled={isSaving}
                className="h-9 w-9 rounded-full"
                title="Save as draft (only visible to you)"
                aria-label="Save as draft"
                aria-busy={isSaving}
              >
                <Save size={16} />
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPreview(!showPreview)}
              className="h-9 w-9 rounded-full"
              aria-label={showPreview ? "Switch to edit mode" : "Preview chapter"}
              title={showPreview ? "Switch to edit mode" : "Preview chapter"}
            >
              <Eye size={16} />
            </Button>

            <Button
              onClick={() => setIsPublishDialogOpen(true)}
              className="flex items-center gap-2"
              disabled={!chapter.id || chapter.status === "published"}
              title={chapter.status === "published" ? "Chapter is already published" : "Publish chapter (visible to all readers)"}
              aria-label="Publish chapter"
              aria-disabled={!chapter.id || chapter.status === "published"}
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
                  <div className="text-sm">
                    {isSaving ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : hasChanges ? (
                      <span className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Unsaved changes
                      </span>
                    ) : chapter.lastSaved ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Saved at {new Date(chapter.lastSaved).toLocaleTimeString()}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    {chapter.status === "published" || chapter.status === "scheduled" ? (
                      <Button
                        onClick={() => saveChapter(true, false, true)}
                        disabled={isSaving}
                        className="flex items-center justify-start gap-2 w-full"
                      >
                        <Save size={16} />
                        Update Chapter
                      </Button>
                    ) : (
                      <Button
                        onClick={() => saveChapter(true, true)}
                        disabled={isSaving}
                        className="flex items-center justify-start gap-2 w-full"
                      >
                        <Save size={16} />
                        Save Draft
                      </Button>
                    )}

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
                      disabled={!chapter.id || chapter.status === "published"}
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
  )
})
