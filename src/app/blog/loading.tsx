import StoryCardSkeleton from "@/components/story-card-skeleton"

interface LoadingProps {
  gridClassName?: string
  viewMode?: "grid" | "list"
}

export default function Loading({ gridClassName, viewMode = "grid" }: LoadingProps) {
  const skeletonCount = viewMode === "grid" ? 9 : 5

  return (
    <div className={gridClassName}>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <StoryCardSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  )
}
