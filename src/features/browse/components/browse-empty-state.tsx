"use client"

import { Button } from "@/components/ui/button"
import { SearchX } from "lucide-react"

interface BrowseEmptyStateProps {
  onResetFilters?: () => void
}

export function BrowseEmptyState({ onResetFilters }: BrowseEmptyStateProps) {
  return (
    <div className="text-center py-16 px-4 bg-muted/20 rounded-xl border border-dashed my-6">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-muted/60 p-4">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">No stories found</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        We couldn&apos;t find any stories matching your current filters. Try changing your search query or removing some filters.
      </p>
      {onResetFilters && (
        <Button variant="outline" onClick={onResetFilters}>
          Clear All Filters
        </Button>
      )}
    </div>
  )
}
