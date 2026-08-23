"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { ImageService } from "@/lib/api/images"
import { CommentReplyItem } from "./comment-reply-item"
import type { CommentReplyTreeProps } from "../types/comment.types"

export function CommentReplyTree({
  parentId,
  currentUserId,
  replies,
  replyingTo,
  replyContent,
  setReplyingTo,
  setReplyContent,
  onReplySubmit,
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
}: CommentReplyTreeProps) {
  const { user } = useAuth()
  const isReplying = replyingTo === parentId

  return (
    <>
      {/* Inline Reply Form */}
      {isReplying && (
        <div className="mt-2 ml-4">
          <div className="flex gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={ImageService.getImageUrl(user?.image) || "/placeholder-user.jpg"}
                alt="Your Avatar"
              />
              <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                className="resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => onReplySubmit(parentId)}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting ? "Posting..." : "Reply"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replies List */}
      {replies && replies.length > 0 && (
        <div className="mt-4 ml-8 space-y-4">
          {replies.map(reply => (
            <CommentReplyItem
              key={reply.id}
              reply={reply}
              parentId={parentId}
              currentUserId={currentUserId}
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
          ))}
        </div>
      )}
    </>
  )
}
