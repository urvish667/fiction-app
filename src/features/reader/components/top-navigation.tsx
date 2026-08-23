"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ChevronLeft, ChevronRight, ArrowLeft, List, AlignJustify, Minus, Plus } from "lucide-react"
import { ChapterList } from "@/features/story"
import type { TopNavigationProps } from "../types/reader.types"

export function TopNavigation({
  slug,
  chapters,
  currentChapter,
  fontSize,
  adjustFontSize,
  handleBackToStory,
  navigateToChapter,
}: TopNavigationProps) {
  const currentIndex = chapters.findIndex(c => c.number === currentChapter.number)

  return (
    <div className="flex justify-between items-center mb-6 sm:mb-8 gap-2">
      {/* Back to Story Button */}
      <Button variant="ghost" onClick={handleBackToStory} className="pl-0 flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <ArrowLeft size={16} />
        <span className="text-sm sm:text-base hidden xs:inline">Back to Story</span>
        <span className="text-sm xs:hidden">Back</span>
      </Button>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Chapter Navigation */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {currentIndex <= 0 ? (
                  <Button
                    variant="outline"
                    size="icon"
                    disabled
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                    <span className="sr-only">Previous Chapter</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <Link
                      href={`/story/${slug}/chapter/${chapters[currentIndex - 1].number}`}
                      onClick={e => {
                        e.preventDefault()
                        navigateToChapter("prev")
                      }}
                    >
                      <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                      <span className="sr-only">Previous Chapter</span>
                    </Link>
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent>Previous Chapter</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Chapter Selector Drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="mx-1 sm:mx-2 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-3">
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
                {currentIndex >= chapters.length - 1 ? (
                  <Button
                    variant="outline"
                    size="icon"
                    disabled
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                    <span className="sr-only">Next Chapter</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <Link
                      href={`/story/${slug}/chapter/${chapters[currentIndex + 1].number}`}
                      onClick={e => {
                        e.preventDefault()
                        navigateToChapter("next")
                      }}
                    >
                      <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                      <span className="sr-only">Next Chapter</span>
                    </Link>
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent>Next Chapter</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Reading Font Settings */}
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

export default TopNavigation
