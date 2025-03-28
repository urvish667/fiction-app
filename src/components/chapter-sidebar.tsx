"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { ChevronLeft, ChevronRight, Plus, Trash2, MoreHorizontal, GripVertical } from "lucide-react"

interface ChapterData {
  id: string
  title: string
  order: number
}

interface ChapterSidebarProps {
  chapters: ChapterData[]
  activeChapterId: string
  onChapterSelect: (chapterId: string) => void
  onChapterDelete: (chapterId: string) => void
  onChapterReorder: (startIndex: number, endIndex: number) => void
  onAddChapter: () => void
  isOpen: boolean
  onToggle: () => void
}

export default function ChapterSidebar({
  chapters,
  activeChapterId,
  onChapterSelect,
  onChapterDelete,
  onChapterReorder,
  onAddChapter,
  isOpen,
  onToggle,
}: ChapterSidebarProps) {
  // Handle drag end
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination } = result
    onChapterReorder(source.index, destination.index)
  }

  return (
    <div className={`border-r bg-muted/30 transition-all duration-300 ${isOpen ? "w-64" : "w-0"} relative`}>
      {/* Toggle Button */}
      <Button variant="ghost" size="icon" onClick={onToggle} className="absolute -right-10 top-4 bg-background border">
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </Button>

      <div className={`p-4 h-full flex flex-col ${isOpen ? "" : "hidden"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Chapters</h2>
          <Button size="sm" onClick={onAddChapter} className="flex items-center gap-1">
            <Plus size={14} />
            Add
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="chapters" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                  {chapters
                    .sort((a, b) => a.order - b.order)
                    .map((chapter, index) => (
                      <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                              activeChapterId === chapter.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                            }`}
                          >
                            <div
                              className="flex items-center flex-1 cursor-pointer overflow-hidden"
                              onClick={() => onChapterSelect(chapter.id)}
                            >
                              <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                                <GripVertical size={14} />
                              </div>
                              <span className="truncate">{chapter.title || `Chapter ${chapter.order}`}</span>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-6 w-6 ${
                                    activeChapterId === chapter.id
                                      ? "text-primary-foreground hover:bg-primary/90"
                                      : ""
                                  }`}
                                >
                                  <MoreHorizontal size={14} />
                                  <span className="sr-only">Chapter menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onChapterSelect(chapter.id)}>Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onChapterDelete(chapter.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </li>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  )
}
