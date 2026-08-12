"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { ImageService } from "@/lib/api/images"
import { cn } from "@/lib/utils"

export interface StoryCoverProps {
  src?: string | null
  alt: string
  isMature?: boolean
  genre?: string | { name: string } | null
  aspectRatio?: string
  sizes?: string
  priority?: boolean
  className?: string
  imageClassName?: string
  hoverScale?: boolean
}

export function StoryCover({
  src,
  alt,
  isMature = false,
  genre,
  aspectRatio = "aspect-[2/3]",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  className,
  imageClassName,
  hoverScale = false,
}: StoryCoverProps) {
  const [imageError, setImageError] = useState(false)

  const imageUrl = imageError || !src
    ? "/placeholder.svg"
    : (ImageService.getImageUrl(src) || "/placeholder.svg")

  const genreName = typeof genre === 'object' && genre !== null
    ? genre.name
    : (typeof genre === 'string' ? genre : null)

  return (
    <div
      className={cn(
        "relative w-full rounded-lg overflow-hidden shadow-md bg-muted/30",
        aspectRatio,
        className
      )}
    >
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          "object-cover object-center transition-transform duration-300",
          hoverScale && "hover:scale-105",
          imageClassName
        )}
        onError={() => setImageError(true)}
        unoptimized={true}
      />

      {/* Badges Overlay */}
      {(isMature || genreName) && (
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10 gap-2">
          <div>
            {isMature && (
              <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-2.5 py-0.5 shadow-sm">
                18+
              </Badge>
            )}
          </div>
          <div>
            {genreName && (
              <Badge variant="secondary" className="backdrop-blur-md bg-background/80 text-xs shadow-sm">
                {genreName}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StoryCover
