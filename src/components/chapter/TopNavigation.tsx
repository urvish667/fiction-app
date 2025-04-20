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
    <div className="flex justify-between items-center mb-6 sm:mb-8">
      <Button variant="ghost" onClick={handleBackToStory} className="pl-0 flex items-center gap-1 sm:gap-2">
        <ArrowLeft size={16} />
        <span className="text-sm sm:text-base">Back to Story</span>
      </Button>

      <div className="flex items-center gap-2">
        {/* Chapter Navigation */}
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateToChapter("prev")}
                  disabled={currentIndex <= 0}
                >
                  <ChevronLeft size={16} />
                  <span className="sr-only">Previous Chapter</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous Chapter</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Chapter Selector */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="mx-2 text-xs sm:text-sm">
                <span className="hidden xs:inline">Chapter </span>{currentIndex + 1}/{chapters.length}
                <List size={16} className="ml-1 sm:ml-2" />
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
                >
                  <ChevronRight size={16} />
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
                  <Button variant="outline" size="icon">
                    <AlignJustify size={16} />
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
