import StoryCardSkeleton from "@/components/story-card-skeleton"
import type { StoryCardVariant } from "@/components/story-card"

interface LoadingProps {
  gridClassName?: string
  viewMode?: "grid" | "list"
}

export default function Loading({ gridClassName, viewMode = "grid" }: LoadingProps) {
  const skeletonCount = viewMode === "grid" ? 9 : 5
  const variant: StoryCardVariant = viewMode === "grid" ? "portrait-grid" : "landscape-list"

  return (
    <div className={gridClassName}>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <StoryCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  )
}
