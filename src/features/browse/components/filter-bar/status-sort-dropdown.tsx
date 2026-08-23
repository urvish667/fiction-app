"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface StatusSortDropdownProps {
  sortBy: string
  onSortChange: (sort: string) => void
  storyStatus: "all" | "ongoing" | "completed"
  onStatusChange: (status: "all" | "ongoing" | "completed") => void
}

export function StatusSortDropdown({
  sortBy,
  onSortChange,
  storyStatus,
  onStatusChange,
}: StatusSortDropdownProps) {
  const getSortLabel = () => {
    switch (sortBy) {
      case "popular":
        return "Popular"
      case "mostRead":
        return "Most Read"
      default:
        return "Newest"
    }
  }

  const getStatusLabel = () => {
    switch (storyStatus) {
      case "ongoing":
        return "Ongoing"
      case "completed":
        return "Completed"
      default:
        return "All"
    }
  }

  return (
    <>
      {/* Sort By Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 text-sm">
            <span className="hidden sm:inline">Sort By: </span>
            {getSortLabel()}
            <ChevronDown className="ml-1 sm:ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sortBy} onValueChange={onSortChange}>
            <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="popular">Popular</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="mostRead">Most Read</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Story Status Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 text-sm">
            <span className="hidden sm:inline">Status: </span>
            {getStatusLabel()}
            <ChevronDown className="ml-1 sm:ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Story Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={storyStatus}
            onValueChange={value => onStatusChange(value as "all" | "ongoing" | "completed")}
          >
            <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="ongoing">Ongoing</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
