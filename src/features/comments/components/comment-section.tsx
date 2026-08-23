"use client"

import { AlertCircle } from "lucide-react"
import { ReportDialog } from "@/components/common"
import { useComments } from "../hooks/use-comments"
import { CommentForm } from "./comment-form"
import { CommentList } from "./comment-list"
import type { CommentSectionProps } from "../types/comment.types"

export function CommentSection({
  storyId,
  chapterId,
  isChapterComment = false,
}: CommentSectionProps) {
  const isChapter = isChapterComment && Boolean(chapterId)

  const {
    user,
    comments,
    newComment,
    setNewComment,
    isLoading,
    error,
    hasMore,
    isSubmitting,
    editingComment,
    setEditingComment,
    editContent,
    setEditContent,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    expandedReplies,
    loadingReplies,
    editingReply,
    setEditingReply,
    editReplyContent,
    setEditReplyContent,
    likingComment,
    isReportDialogOpen,
    reportingCommentId,
    loadMoreComments,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    handleReplyToComment,
    handleEditReply,
    handleDeleteReply,
    handleLike,
    loadReplies,
    openReportDialog,
    closeReportDialog,
  } = useComments({ storyId, chapterId, isChapterComment })

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <CommentForm
        storyId={storyId}
        chapterId={chapterId}
        isChapter={isChapter}
        newComment={newComment}
        setNewComment={setNewComment}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitComment}
      />

      {/* Initial load fallback */}
      {isLoading && comments.length === 0 ? (
        <div className="text-center py-8 bg-muted/30 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading comments...</p>
        </div>
      ) : (
        <CommentList
          comments={comments}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={loadMoreComments}
          storyId={storyId}
          chapterId={chapterId}
          isChapter={isChapter}
          currentUserId={user?.id}
          isSubmitting={isSubmitting}
          editingComment={editingComment}
          editContent={editContent}
          setEditingComment={setEditingComment}
          setEditContent={setEditContent}
          onEditSubmit={handleEditComment}
          onDelete={handleDeleteComment}
          onLike={handleLike}
          onReport={openReportDialog}
          replyingTo={replyingTo}
          replyContent={replyContent}
          setReplyingTo={setReplyingTo}
          setReplyContent={setReplyContent}
          onReplySubmit={handleReplyToComment}
          expandedReplies={expandedReplies}
          loadingReplies={loadingReplies}
          editingReply={editingReply}
          editReplyContent={editReplyContent}
          setEditingReply={setEditingReply}
          setEditReplyContent={setEditReplyContent}
          onReplyEditSubmit={handleEditReply}
          onReplyDelete={handleDeleteReply}
          onLoadReplies={loadReplies}
          likingComment={likingComment}
        />
      )}

      {/* Report Modal */}
      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={closeReportDialog}
        storyId={storyId}
        commentId={reportingCommentId}
      />
    </div>
  )
}

export default CommentSection
