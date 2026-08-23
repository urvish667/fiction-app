import type { Comment } from "@/types/story"

export interface CommentSectionProps {
  storyId: string
  chapterId?: string
  isChapterComment?: boolean
}

export interface CommentFormProps {
  storyId: string
  chapterId?: string
  isChapter?: boolean
  newComment: string
  setNewComment: (value: string) => void
  isSubmitting: boolean
  onSubmit: () => Promise<void>
}

export interface CommentItemProps {
  comment: Comment
  storyId: string
  chapterId?: string
  isChapter?: boolean
  currentUserId?: string
  isSubmitting: boolean
  editingComment: string | null
  editContent: string
  setEditingComment: (id: string | null) => void
  setEditContent: (content: string) => void
  onEditSubmit: (commentId: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  onLike: (id: string, isReply?: boolean) => Promise<void>
  onReport: (commentId: string) => void
  replyingTo: string | null
  replyContent: string
  setReplyingTo: (id: string | null) => void
  setReplyContent: (content: string) => void
  onReplySubmit: (parentId: string) => Promise<void>
  expandedReplies: Record<string, Comment[]>
  loadingReplies: Record<string, boolean>
  editingReply: string | null
  editReplyContent: string
  setEditingReply: (id: string | null) => void
  setEditReplyContent: (content: string) => void
  onReplyEditSubmit: (commentId: string, replyId: string) => Promise<void>
  onReplyDelete: (commentId: string, replyId: string) => Promise<void>
  onLoadReplies: (commentId: string) => Promise<void>
  likingComment: Record<string, boolean>
}

export interface CommentListProps {
  comments: Comment[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => Promise<void>
  storyId: string
  chapterId?: string
  isChapter?: boolean
  currentUserId?: string
  isSubmitting: boolean
  editingComment: string | null
  editContent: string
  setEditingComment: (id: string | null) => void
  setEditContent: (content: string) => void
  onEditSubmit: (commentId: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  onLike: (id: string, isReply?: boolean) => Promise<void>
  onReport: (commentId: string) => void
  replyingTo: string | null
  replyContent: string
  setReplyingTo: (id: string | null) => void
  setReplyContent: (content: string) => void
  onReplySubmit: (parentId: string) => Promise<void>
  expandedReplies: Record<string, Comment[]>
  loadingReplies: Record<string, boolean>
  editingReply: string | null
  editReplyContent: string
  setEditingReply: (id: string | null) => void
  setEditReplyContent: (content: string) => void
  onReplyEditSubmit: (commentId: string, replyId: string) => Promise<void>
  onReplyDelete: (commentId: string, replyId: string) => Promise<void>
  onLoadReplies: (commentId: string) => Promise<void>
  likingComment: Record<string, boolean>
}

export interface CommentReplyTreeProps {
  parentId: string
  storyId: string
  currentUserId?: string
  replies: Comment[]
  replyingTo: string | null
  replyContent: string
  setReplyingTo: (id: string | null) => void
  setReplyContent: (content: string) => void
  onReplySubmit: (parentId: string) => Promise<void>
  isSubmitting: boolean
  editingReply: string | null
  editReplyContent: string
  setEditingReply: (id: string | null) => void
  setEditReplyContent: (content: string) => void
  onReplyEditSubmit: (commentId: string, replyId: string) => Promise<void>
  onReplyDelete: (commentId: string, replyId: string) => Promise<void>
  onLike: (id: string, isReply?: boolean) => Promise<void>
  onReport: (replyId: string) => void
  likingComment: Record<string, boolean>
}

export interface CommentReplyItemProps {
  reply: Comment
  parentId: string
  currentUserId?: string
  isSubmitting: boolean
  editingReply: string | null
  editReplyContent: string
  setEditingReply: (id: string | null) => void
  setEditReplyContent: (content: string) => void
  onReplyEditSubmit: (commentId: string, replyId: string) => Promise<void>
  onReplyDelete: (commentId: string, replyId: string) => Promise<void>
  onLike: (id: string, isReply?: boolean) => Promise<void>
  onReport: (replyId: string) => void
  likingComment: Record<string, boolean>
}

export interface CommentActionsMenuProps {
  itemId: string
  itemUserId?: string
  currentUserId?: string
  onReply?: () => void
  onReport: () => void
  onEdit: () => void
  onDelete: () => void
}

export interface CommentEditInputProps {
  content: string
  onChange: (value: string) => void
  onCancel: () => void
  onSave: () => void
  isSubmitting: boolean
  size?: "sm" | "default"
}
