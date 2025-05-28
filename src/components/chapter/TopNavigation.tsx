"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ChevronLeft, ChevronRight, ArrowLeft, List, AlignJustify, Minus, Plus } from "lucide-react"
import ChapterList from "@/components/chapter-list"
import { Chapter } from "@/types/story"

interface TopNavigationProps {
  slug: string
  chapters: Chapter[]
  currentChapter: Chapter
  fontSize: number
  adjustFontSize: (amount: number) => void
  handleBackToStory: () => void
  navigateToChapter: (direction: "prev" | "next") => void
}

export function TopNavigation({
  slug,
  chapters,
  currentChapter,
  fontSize,
  adjustFontSize,
  handleBackToStory,
  navigateToChapter
}: TopNavigationProps) {
  const currentIndex = chapters.findIndex((c) => c.number === currentChapter.number)

  return (
    <div className="flex justify-between items-center mb-6 sm:mb-8 gap-2">
      {/* Back to Story Button - Responsive text */}
      <Button variant="ghost" onClick={handleBackToStory} className="pl-0 flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <ArrowLeft size={16} />
        <span className="text-sm sm:text-base hidden xs:inline">Back to Story</span>
        <span className="text-sm xs:hidden">Back</span>
      </Button>

      {/* Navigation Controls - Responsive layout */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Chapter Navigation */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateToChapter("prev")}
                  disabled={currentIndex <= 0}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                  <span className="sr-only">Previous Chapter</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous Chapter</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Chapter Selector - Responsive text */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="mx-1 sm:mx-2 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-3">
                {/* Show abbreviated format on very small screens */}
                <span className="hidden sm:inline">Chapter {currentIndex + 1}/{chapters.length}</span>
                <span className="sm:hidden">{currentIndex + 1}/{chapters.length}</span>
                <List size={14} className="ml-1 sm:ml-2 sm:w-4 sm:h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Table of Contents</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <ChapterList chapters={chapters} storySlug={slug} currentChapter={currentChapter.number} />
              </div>
            </SheetContent>
          </Sheet>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateToChapter("next")}
                  disabled={currentIndex >= chapters.length - 1}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                  <span className="sr-only">Next Chapter</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next Chapter</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Reading Settings */}
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                    <AlignJustify size={14} className="sm:w-4 sm:h-4" />
                    <span className="sr-only">Reading Settings</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Reading Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end">
            <div className="p-2">
              <p className="text-sm font-medium mb-2">Font Size</p>
              <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" onClick={() => adjustFontSize(-1)}>
                  <Minus size={14} />
                </Button>
                <span className="mx-2">{fontSize}px</span>
                <Button variant="outline" size="icon" onClick={() => adjustFontSize(1)}>
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
