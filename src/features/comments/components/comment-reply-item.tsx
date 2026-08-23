"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { ImageService } from "@/lib/api/images"
import { CommentActionsMenu } from "./comment-actions-menu"
import { CommentEditInput } from "./comment-edit-input"
import { formatCommentDate } from "../utils/format-comment-date"
import type { CommentReplyItemProps } from "../types/comment.types"

export function CommentReplyItem({
  reply,
  parentId,
  currentUserId,
  isSubmitting,
  editingReply,
  editReplyContent,
  setEditingReply,
  setEditReplyContent,
  onReplyEditSubmit,
  onReplyDelete,
  onLike,
  onReport,
  likingComment,
}: CommentReplyItemProps) {
  const isEditing = editingReply === reply.id
  const authorName = reply.user?.name || reply.user?.username || "Unknown User"
  const avatarUrl = ImageService.getImageUrl(reply.user?.image) || "/placeholder-user.jpg"
  const fallbackInitial = (reply.user?.name?.[0] || "U").toUpperCase()

  const handleStartEdit = () => {
    setEditingReply(reply.id)
    setEditReplyContent(reply.content)
  }

  const handleCancelEdit = () => {
    setEditingReply(null)
    setEditReplyContent("")
  }

  const handleSaveEdit = () => {
    onReplyEditSubmit(parentId, reply.id)
  }

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl} alt={authorName} />
        <AvatarFallback>{fallbackInitial}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex justify-between items-start mb-1">
            <div>
              <span className="font-medium text-sm">{authorName}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {formatCommentDate(reply.createdAt)}
              </span>
            </div>

            <CommentActionsMenu
              itemId={reply.id}
              itemUserId={reply.userId}
              currentUserId={currentUserId}
              onReport={() => onReport(reply.id)}
              onEdit={handleStartEdit}
              onDelete={() => onReplyDelete(parentId, reply.id)}
              iconSize={14}
              buttonClassName="h-6 w-6"
            />
          </div>

          {isEditing ? (
            <CommentEditInput
              content={editReplyContent}
              onChange={setEditReplyContent}
              onCancel={handleCancelEdit}
              onSave={handleSaveEdit}
              isSubmitting={isSubmitting}
              size="sm"
            />
          ) : (
            <p className="text-sm">{reply.content}</p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 ml-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-6 w-6"
            onClick={() => onLike(reply.id, true)}
            disabled={likingComment[reply.id]}
            title={likingComment[reply.id] ? "Liking..." : reply.isLiked ? "Unlike" : "Like"}
          >
            <Heart
              size={12}
              className={reply.isLiked ? "fill-current text-red-500" : ""}
            />
          </Button>
        </div>
      </div>
    </div>
  )
}
