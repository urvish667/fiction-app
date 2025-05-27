import { Eye, Heart, MessageSquare, Clock, BookOpen } from "lucide-react"
import type { Story } from "@/types/story"
import LicenseInfo from "./license-info"
import { formatStatNumber } from "@/utils/number-utils"

interface StoryMetadataProps {
  story: Story
  className?: string
  showLicense?: boolean
}

export default function StoryMetadata({ story, className = "", showLicense = false }: StoryMetadataProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Eye size={16} className="text-muted-foreground" />
          <span>{formatStatNumber(story.viewCount || 0)} Views</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart size={16} className="text-muted-foreground" />
          <span>{formatStatNumber(story.likeCount || 0)} Likes</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare size={16} className="text-muted-foreground" />
          <span>{formatStatNumber(story.commentCount || 0)} Comments</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={16} className="text-muted-foreground" />
          <span>{Math.ceil(story.wordCount / 200) || 1} min read</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen size={16} className="text-muted-foreground" />
          <span>{formatStatNumber(story.wordCount || 0)} words</span>
        </div>
      </div>

      {showLicense && story.license && (
        <LicenseInfo license={story.license} />
      )}
    </div>
  )
}

