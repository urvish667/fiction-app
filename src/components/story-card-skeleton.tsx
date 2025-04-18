"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StoryCardSkeletonProps {
  viewMode?: "grid" | "list"
}

export default function StoryCardSkeleton({ viewMode = "grid" }: StoryCardSkeletonProps) {
  const isGrid = viewMode === "grid"

  return (
    <Card className={`overflow-hidden flex ${isGrid ? "flex-col" : "flex-row"} h-full`}>
      <div className={`${isGrid ? "w-full" : "w-1/3"} relative`}>
        <div className={`relative ${isGrid ? "aspect-[3/2]" : "h-full min-h-[180px]"} overflow-hidden bg-muted`}>
          <Skeleton className="h-full w-full" />
          <div className="absolute top-2 right-2">
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>

      <div className={`${isGrid ? "w-full" : "w-2/3"} flex flex-col h-full`}>
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>

        <CardContent className="pb-1 pt-0 px-4 flex-grow">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>

        <CardFooter className="pt-0 pb-2 px-4 flex justify-between mt-auto">
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardFooter>
      </div>
    </Card>
  )
}
