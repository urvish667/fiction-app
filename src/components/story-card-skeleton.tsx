"use client"

import { Skeleton } from "@/components/ui/skeleton"
import type { StoryCardVariant } from "@/components/story-card"
import { cn } from "@/lib/utils"

interface StoryCardSkeletonProps {
  variant?: StoryCardVariant
  overlayTitle?: boolean
  className?: string
}

export default function StoryCardSkeleton({
  variant = "portrait-grid",
  overlayTitle = false,
  className,
}: StoryCardSkeletonProps) {
  if (variant === "portrait-grid") {
    if (overlayTitle) {
      return (
        <div className={cn("relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-muted p-2.5 flex flex-col justify-between shadow-sm", className)}>
          {/* Top badge skeleton */}
          <Skeleton className="h-5 w-16 rounded-md bg-muted-foreground/20" />
          {/* Bottom overlay title skeleton */}
          <div className="space-y-1.5 mt-auto z-10">
            <Skeleton className="h-4 w-4/5 rounded bg-muted-foreground/25" />
            <Skeleton className="h-3.5 w-3/5 rounded bg-muted-foreground/25" />
          </div>
        </div>
      )
    }

    return (
      <div className={cn("flex flex-col h-full", className)}>
        {/* Portrait image skeleton */}
        <Skeleton className="aspect-[2/3] w-full rounded-xl mb-3" />
        {/* Title */}
        <Skeleton className="h-4 w-4/5 mb-1.5 rounded" />
        <Skeleton className="h-3.5 w-3/5 mb-1.5 rounded" />
        {/* Author */}
        <Skeleton className="h-3 w-2/5 mb-3 rounded" />
        {/* Stats */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-10 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
      </div>
    )
  }

  if (variant === "landscape-list") {
    return (
      <div className={cn("flex gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-xl border border-border/50 h-full items-start", className)}>
        {/* Thumbnail */}
        <Skeleton className="w-24 sm:w-28 aspect-[2/3] rounded-lg shrink-0 self-start" />
        {/* Info */}
        <div className="flex flex-col flex-1 min-w-0 py-0.5 gap-2 h-full justify-between">
          <div>
            <Skeleton className="h-4 w-4/5 rounded mb-1.5" />
            <Skeleton className="h-3 w-2/5 rounded mb-2" />
            <Skeleton className="h-3 w-full rounded mb-1" />
            <Skeleton className="h-3 w-3/4 rounded" />
          </div>
          <div className="flex items-center justify-between mt-auto pt-1">
            <Skeleton className="h-4 w-16 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-8 rounded" />
              <Skeleton className="h-3 w-8 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "mini-horizontal") {
    return (
      <div className={cn("flex gap-3 items-center", className)}>
        <Skeleton className="w-10 aspect-[2/3] rounded-md shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-full mb-1.5 rounded" />
          <Skeleton className="h-3 w-3/5 rounded" />
        </div>
      </div>
    )
  }

  if (variant === "featured") {
    return (
      <div className={cn("overflow-hidden rounded-2xl", className)}>
        <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
      </div>
    )
  }

  // Fallback
  return <Skeleton className={cn("aspect-[2/3] rounded-xl", className)} />
}
