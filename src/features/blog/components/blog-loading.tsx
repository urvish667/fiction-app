import { StoryCardSkeleton, type StoryCardVariant } from "@/features/story"
import type { BlogLoadingProps } from "../types/blog.types"

export function BlogLoading({ gridClassName, viewMode = "grid" }: BlogLoadingProps) {
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

export default BlogLoading
