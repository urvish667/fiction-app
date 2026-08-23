"use client"

import Image from "next/image"
import {
  type StoryCardData,
  getAuthorName,
  getImageUrl,
} from "./story-card.types"

export function MiniHorizontalCard({ story }: { story: StoryCardData }) {
  const imageUrl = getImageUrl(story.coverImage)
  const authorName = getAuthorName(story.author)

  return (
    <div className="group flex gap-3 items-center">
      <div className="relative w-10 aspect-[2/3] shrink-0 overflow-hidden rounded-md shadow-sm">
        <Image
          src={imageUrl}
          alt={story.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-serif font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {story.title}
        </h4>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{authorName}</p>
      </div>
    </div>
  )
}
