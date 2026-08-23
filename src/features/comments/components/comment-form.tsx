"use client"

import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageService } from "@/lib/api/images"
import type { CommentFormProps } from "../types/comment.types"

export function CommentForm({
  newComment,
  setNewComment,
  isSubmitting,
  onSubmit,
}: CommentFormProps) {
  const { user } = useAuth()
  const avatarUrl = ImageService.getImageUrl(user?.image) || "/placeholder-user.jpg"
  const fallbackInitial = (user?.name?.[0] || "U").toUpperCase()

  return (
    <div className="flex gap-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl} alt="Your Avatar" />
        <AvatarFallback>{fallbackInitial}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <Textarea
          placeholder={user ? "Add a comment..." : "Login to comment"}
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          disabled={!user || isSubmitting}
          className="resize-none"
        />

        {user && (
          <div className="flex justify-end">
            <Button
              onClick={onSubmit}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
