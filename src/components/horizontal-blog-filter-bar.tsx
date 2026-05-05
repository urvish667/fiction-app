"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, X } from "lucide-react"
import SearchBar from "@/components/search-bar"

interface HorizontalBlogFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  categories: string[]
  selectedCategories: string[]
  onCategoryChange: (categories: string[]) => void
}

export default function HorizontalBlogFilterBar({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategories,
  onCategoryChange,
}: HorizontalBlogFilterBarProps) {
  const handleSearch = (query: string) => {
    onSearchChange(query)
  }

  const clearAllFilters = () => {
    onSearchChange("")
    onCategoryChange([])
  }

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category))
    } else {
      onCategoryChange([...selectedCategories, category])
    }
  }

  const hasActiveFilters = searchQuery || selectedCategories.length > 0

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        defaultValue={searchQuery}
        className="w-full"
        placeholder="Search articles, authors, or categories..."
      />

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Category Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 text-sm">
              Category
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-1 sm:ml-2 px-1.5 py-0 text-xs">
                  {selectedCategories.length}
                </Badge>
              )}
              <ChevronDown className="ml-1 sm:ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Select Categories</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categories.map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              >
                {category}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-9 text-sm">
            <span className="hidden sm:inline">Clear All</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <Badge key={`cat-${category}`} variant="outline" className="flex items-center gap-1 bg-primary/5">
              <span>{category}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCategoryToggle(category)}
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
