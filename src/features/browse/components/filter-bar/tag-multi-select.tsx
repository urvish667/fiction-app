"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { ChevronDown, Loader2 } from "lucide-react"
import type { TagOption } from "../../types/browse.types"

interface TagMultiSelectProps {
  tags: TagOption[]
  selectedTags: string[]
  onTagToggle: (tagName: string) => void
  loadingTags?: boolean
}

export function TagMultiSelect({
  tags,
  selectedTags,
  onTagToggle,
  loadingTags = false,
}: TagMultiSelectProps) {
  const [tagSearchOpen, setTagSearchOpen] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState("")

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  )

  return (
    <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 text-sm">
          Tags
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="ml-1 sm:ml-2 px-1.5 py-0 text-xs">
              {selectedTags.length}
            </Badge>
          )}
          <ChevronDown className="ml-1 sm:ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search tags..."
            value={tagSearchQuery}
            onValueChange={setTagSearchQuery}
          />
          <CommandEmpty>No tags found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {loadingTags ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              filteredTags.map(tag => (
                <CommandItem
                  key={tag.id}
                  onSelect={() => onTagToggle(tag.name)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.name)}
                      onChange={() => onTagToggle(tag.name)}
                      className="h-4 w-4"
                    />
                    <span>{tag.name}</span>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
