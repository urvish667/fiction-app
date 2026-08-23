"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, Reply } from "lucide-react"
import { ImageService } from "@/lib/api/images"
import { CommentActionsMenu } from "./comment-actions-menu"
import { CommentEditInput } from "./comment-edit-input"
import { CommentReplyTree } from "./comment-reply-tree"
import { formatCommentDate } from "../utils/format-comment-date"
import type { CommentItemProps } from "../types/comment.types"

export function CommentItem({
  comment,
  storyId,
  chapterId,
  isChapter,
  currentUserId,
  isSubmitting,
  editingComment,
  editContent,
  setEditingComment,
  setEditContent,
  onEditSubmit,
  onDelete,
  onLike,
  onReport,
  replyingTo,
  replyContent,
  setReplyingTo,
  setReplyContent,
  onReplySubmit,
  expandedReplies,
  loadingReplies,
  editingReply,
  editReplyContent,
  setEditingReply,
  setEditReplyContent,
  onReplyEditSubmit,
  onReplyDelete,
  onLoadReplies,
  likingComment,
}: CommentItemProps) {
  const { user } = useAuth()
  const router = useRouter()

  const isEditing = editingComment === comment.id
  const authorName = comment.user?.name || comment.user?.username || "Unknown User"
  const avatarUrl = ImageService.getImageUrl(comment.user?.image) || "/placeholder-user.jpg"
  const fallbackInitial = (comment.user?.name?.[0] || "U").toUpperCase()
  const replyCount = comment.replyCount ?? 0
  const isRepliesExpanded = Boolean(expandedReplies[comment.id])
  const isLoadingReplies = Boolean(loadingReplies[comment.id])

  const handleStartReply = () => {
    if (!user) {
      const callbackUrl = `/story/${storyId}${isChapter && chapterId ? `/chapter/${chapterId}` : ""}`
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }
    setReplyingTo(comment.id)
    setReplyContent("")
  }

  const handleStartEdit = () => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingComment(null)
    setEditContent("")
  }

  const handleSaveEdit = () => {
    onEditSubmit(comment.id)
  }

  return (
    <div className="flex gap-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl} alt={authorName} />
        <AvatarFallback>{fallbackInitial}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-medium">{authorName}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {formatCommentDate(comment.createdAt)}
              </span>
            </div>

            <CommentActionsMenu
              itemId={comment.id}
              itemUserId={comment.userId}
              currentUserId={currentUserId}
              onReply={handleStartReply}
              onReport={() => onReport(comment.id)}
              onEdit={handleStartEdit}
              onDelete={() => onDelete(comment.id)}
            />
          </div>

          {isEditing ? (
            <CommentEditInput
              content={editContent}
              onChange={setEditContent}
              onCancel={handleCancelEdit}
              onSave={handleSaveEdit}
              isSubmitting={isSubmitting}
            />
          ) : (
            <p className="text-sm">{comment.content}</p>
          )}
        </div>

        {/* Action Buttons: Like & Reply */}
        <div className="flex items-center gap-2 mt-2 ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={() => onLike(comment.id)}
            disabled={likingComment[comment.id]}
            title={likingComment[comment.id] ? "Liking..." : comment.isLiked ? "Unlike" : "Like"}
          >
            <Heart
              size={14}
              className={comment.isLiked ? "fill-current text-red-500" : ""}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={handleStartReply}
            title="Reply"
          >
            <Reply size={14} />
          </Button>
        </div>

        {/* Reply count and toggle button */}
        {replyCount > 0 && (
          <div className="mt-2 ml-4">
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => onLoadReplies(comment.id)}
              disabled={isLoadingReplies}
            >
              {isLoadingReplies ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-primary mr-2" />
                  Loading replies...
                </>
              ) : isRepliesExpanded ? (
                `Hide ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
              ) : (
                `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
              )}
            </Button>
          </div>
        )}

        {/* Reply Tree */}
        <CommentReplyTree
          parentId={comment.id}
          storyId={storyId}
          currentUserId={currentUserId}
          replies={expandedReplies[comment.id] || []}
          replyingTo={replyingTo}
          replyContent={replyContent}
          setReplyingTo={setReplyingTo}
          setReplyContent={setReplyContent}
          onReplySubmit={onReplySubmit}
          isSubmitting={isSubmitting}
          editingReply={editingReply}
          editReplyContent={editReplyContent}
          setEditingReply={setEditingReply}
          setEditReplyContent={setEditReplyContent}
          onReplyEditSubmit={onReplyEditSubmit}
          onReplyDelete={onReplyDelete}
          onLike={onLike}
          onReport={onReport}
          likingComment={likingComment}
        />
      </div>
    </div>
  )
}
