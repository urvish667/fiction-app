"use client"

import { Button } from "@/components/ui/button"
import { CommentItem } from "./comment-item"
import type { CommentListProps } from "../types/comment.types"

export function CommentList({
  comments,
  isLoading,
  hasMore,
  onLoadMore,
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
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          storyId={storyId}
          chapterId={chapterId}
          isChapter={isChapter}
          currentUserId={currentUserId}
          isSubmitting={isSubmitting}
          editingComment={editingComment}
          editContent={editContent}
          setEditingComment={setEditingComment}
          setEditContent={setEditContent}
          onEditSubmit={onEditSubmit}
          onDelete={onDelete}
          onLike={onLike}
          onReport={onReport}
          replyingTo={replyingTo}
          replyContent={replyContent}
          setReplyingTo={setReplyingTo}
          setReplyContent={setReplyContent}
          onReplySubmit={onReplySubmit}
          expandedReplies={expandedReplies}
          loadingReplies={loadingReplies}
          editingReply={editingReply}
          editReplyContent={editReplyContent}
          setEditingReply={setEditingReply}
          setEditReplyContent={setEditReplyContent}
          onReplyEditSubmit={onReplyEditSubmit}
          onReplyDelete={onReplyDelete}
          onLoadReplies={onLoadReplies}
          likingComment={likingComment}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2" />
                Loading...
              </>
            ) : (
              "Load More Comments"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
