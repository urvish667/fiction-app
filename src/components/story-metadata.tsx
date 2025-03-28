import { Eye, Heart, MessageSquare, Clock } from "lucide-react"
import type { Story } from "@/lib/types"

interface StoryMetadataProps {
  story: Story
  className?: string
}

export default function StoryMetadata({ story, className = "" }: StoryMetadataProps) {
  return (
    <div className={`flex flex-wrap gap-4 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        <Eye size={16} className="text-muted-foreground" />
        <span>{story.reads.toLocaleString()} Reads</span>
      </div>
      <div className="flex items-center gap-1">
        <Heart size={16} className="text-muted-foreground" />
        <span>{story.likes.toLocaleString()} Likes</span>
      </div>
      <div className="flex items-center gap-1">
        <MessageSquare size={16} className="text-muted-foreground" />
        <span>{story.comments.toLocaleString()} Comments</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock size={16} className="text-muted-foreground" />
        <span>{story.readTime} min read</span>
      </div>
    </div>
  )
}

