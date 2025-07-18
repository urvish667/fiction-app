"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface BlogFiltersProps {
  categories: string[]
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
  onClearFilters: () => void
}

export default function BlogFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  onClearFilters,
}: BlogFiltersProps) {
  const hasActiveFilters = selectedCategory

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasActiveFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Active Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 text-xs">
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {selectedCategory && (
                <Badge variant="default" className="flex items-center gap-1">
                  {selectedCategory}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCategoryChange(null)}
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Categories</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RadioGroup
            value={selectedCategory || ""}
            onValueChange={(value) => onCategoryChange(value || null)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="all-categories" />
              <Label htmlFor="all-categories" className="text-sm font-medium">
                All
              </Label>
            </div>
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <RadioGroupItem value={category} id={category} />
                <Label htmlFor={category} className="text-sm font-medium">
                  {category}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}
