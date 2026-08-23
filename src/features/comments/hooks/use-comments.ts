"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { CommentService } from "@/lib/api/comment"
import { logError } from "@/lib/error-logger"
import type { Comment } from "@/types/story"

const INITIAL_LOAD_COUNT = 2
const LOAD_MORE_COUNT = 3

interface UseCommentsOptions {
  storyId: string
  chapterId?: string
  isChapterComment?: boolean
}

export function useComments({ storyId, chapterId, isChapterComment = false }: UseCommentsOptions) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Editing state for top-level comments
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  // Reply form state
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  // Replies map and reply loading state
  const [expandedReplies, setExpandedReplies] = useState<Record<string, Comment[]>>({})
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({})

  // Editing state for replies
  const [editingReply, setEditingReply] = useState<string | null>(null)
  const [editReplyContent, setEditReplyContent] = useState("")

  // Like pending states
  const [likingComment, setLikingComment] = useState<Record<string, boolean>>({})

  // Report modal state
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null)

  const isChapter = isChapterComment && Boolean(chapterId)

  // ── Fetch Initial Comments ──────────────────────────────────────────────
  const fetchInitialComments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = isChapter && chapterId
        ? await CommentService.getChapterComments(chapterId, { page: 1, limit: INITIAL_LOAD_COUNT })
        : await CommentService.getComments(storyId, { page: 1, limit: INITIAL_LOAD_COUNT })

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch comments")
      }

      setComments(response.data.comments)
      setHasMore(Boolean(response.data.pagination?.hasMore))
    } catch (err) {
      logError(err, { context: "Fetching initial comments", storyId, chapterId })
      setError(`Failed to load ${isChapter ? "chapter" : "story"} comments`)
    } finally {
      setIsLoading(false)
    }
  }, [storyId, chapterId, isChapter])

  useEffect(() => {
    fetchInitialComments()
  }, [fetchInitialComments, isAuthenticated])

  // ── Load More Comments ──────────────────────────────────────────────────
  const loadMoreComments = useCallback(async () => {
    if (!hasMore || isLoading) return

    setIsLoading(true)

    try {
      const nextPage = comments.length <= INITIAL_LOAD_COUNT
        ? 2
        : Math.floor((comments.length - INITIAL_LOAD_COUNT) / LOAD_MORE_COUNT) + 2

      const response = isChapter && chapterId
        ? await CommentService.getChapterComments(chapterId, { page: nextPage, limit: LOAD_MORE_COUNT })
        : await CommentService.getComments(storyId, { page: nextPage, limit: LOAD_MORE_COUNT })

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load more comments")
      }

      setComments(prev => [...prev, ...response.data!.comments])
      setHasMore(Boolean(response.data.pagination?.hasMore))
    } catch (err) {
      logError(err, { context: "Loading more comments", storyId, chapterId })
      toast({
        title: "Error",
        description: `Failed to load more ${isChapter ? "chapter" : "story"} comments`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [hasMore, isLoading, comments.length, isChapter, chapterId, storyId, toast])

  // ── Submit New Comment ──────────────────────────────────────────────────
  const handleSubmitComment = useCallback(async () => {
    const trimmed = newComment.trim()
    if (!trimmed) return

    if (!user) {
      const callbackPath = `/story/${storyId}${isChapter && chapterId ? `/chapter/${chapterId}` : ""}`
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = isChapter && chapterId
        ? await CommentService.createChapterComment(chapterId, storyId, { content: trimmed })
        : await CommentService.createComment(storyId, { content: trimmed })

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to create comment")
      }

      setComments(prev => [response.data!, ...prev])
      setNewComment("")

      toast({
        title: "Comment posted",
        description: `Your ${isChapter ? "chapter" : "story"} comment has been posted successfully`,
      })
    } catch (err) {
      logError(err, { context: "Submitting comment", storyId, chapterId })
      toast({
        title: "Error",
        description: `Failed to post your ${isChapter ? "chapter" : "story"} comment`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [newComment, user, isChapter, chapterId, storyId, router, toast])

  // ── Edit Comment ────────────────────────────────────────────────────────
  const handleEditComment = useCallback(async (commentId: string) => {
    const trimmed = editContent.trim()
    if (!trimmed || !user) return

    setIsSubmitting(true)

    try {
      const response = await CommentService.updateComment(commentId, { content: trimmed })

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to update comment")
      }

      setComments(prev => prev.map(c => (c.id === commentId ? response.data! : c)))
      setEditingComment(null)
      setEditContent("")

      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully",
      })
    } catch (err) {
      logError(err, { context: "Editing comment", storyId, chapterId })
      toast({
        title: "Error",
        description: "Failed to update your comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [editContent, user, storyId, chapterId, toast])

  // ── Delete Comment ──────────────────────────────────────────────────────
  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!user) return

    try {
      const response = await CommentService.deleteComment(commentId)
      if (!response.success) {
        throw new Error(response.message || "Failed to delete comment")
      }

      setComments(prev => prev.filter(c => c.id !== commentId))

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      })
    } catch (err) {
      logError(err, { context: "Deleting comment", storyId, chapterId })
      toast({
        title: "Error",
        description: "Failed to delete your comment",
        variant: "destructive",
      })
    }
  }, [user, storyId, chapterId, toast])

  // ── Reply to Comment ────────────────────────────────────────────────────
  const handleReplyToComment = useCallback(async (parentId: string) => {
    const trimmed = replyContent.trim()
    if (!trimmed || !user) return

    setIsSubmitting(true)

    try {
      const response = isChapter && chapterId
        ? await CommentService.createChapterComment(chapterId, storyId, { content: trimmed, parentId })
        : await CommentService.createComment(storyId, { content: trimmed, parentId })

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to create reply")
      }

      // Update parent comment reply count
      setComments(prev =>
        prev.map(c => (c.id === parentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c))
      )

      // Add to expanded replies if already open
      if (expandedReplies[parentId]) {
        setExpandedReplies(prev => ({
          ...prev,
          [parentId]: [...(prev[parentId] || []), response.data!],
        }))
      }

      setReplyingTo(null)
      setReplyContent("")

      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully",
      })
    } catch (err) {
      logError(err, { context: "Replying to comment", storyId, chapterId })
      toast({
        title: "Error",
        description: "Failed to post your reply",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [replyContent, user, isChapter, chapterId, storyId, expandedReplies, toast])

  // ── Edit Reply ──────────────────────────────────────────────────────────
  const handleEditReply = useCallback(async (commentId: string, replyId: string) => {
    const trimmed = editReplyContent.trim()
    if (!trimmed || !user) return

    setIsSubmitting(true)

    try {
      const response = await CommentService.updateComment(replyId, { content: trimmed })

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to update reply")
      }

      setExpandedReplies(prev => {
        if (!prev[commentId]) return prev
        return {
          ...prev,
          [commentId]: prev[commentId].map(r => (r.id === replyId ? response.data! : r)),
        }
      })

      setEditingReply(null)
      setEditReplyContent("")

      toast({
        title: "Reply updated",
        description: "Your reply has been updated successfully",
      })
    } catch (err) {
      logError(err, { context: "Editing reply", storyId, chapterId })
      toast({
        title: "Error",
        description: "Failed to update your reply",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [editReplyContent, user, storyId, chapterId, toast])

  // ── Delete Reply ────────────────────────────────────────────────────────
  const handleDeleteReply = useCallback(async (commentId: string, replyId: string) => {
    if (!user) return

    try {
      const response = await CommentService.deleteComment(replyId)
      if (!response.success) {
        throw new Error(response.message || "Failed to delete reply")
      }

      setExpandedReplies(prev => {
        if (!prev[commentId]) return prev
        return {
          ...prev,
          [commentId]: prev[commentId].filter(r => r.id !== replyId),
        }
      })

      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, replyCount: Math.max((c.replyCount || 1) - 1, 0) } : c))
      )

      toast({
        title: "Reply deleted",
        description: "Your reply has been deleted successfully",
      })
    } catch (err) {
      logError(err, { context: "Deleting reply", storyId, chapterId })
      toast({
        title: "Error",
        description: "Failed to delete your reply",
        variant: "destructive",
      })
    }
  }, [user, storyId, chapterId, toast])

  // ── Like / Unlike ───────────────────────────────────────────────────────
  const handleLike = useCallback(async (id: string, isReply = false) => {
    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/story/${storyId}`)}`)
      return
    }

    setLikingComment(prev => ({ ...prev, [id]: true }))

    try {
      const target = isReply
        ? Object.values(expandedReplies).flat().find(r => r.id === id)
        : comments.find(c => c.id === id)

      if (!target) {
        throw new Error("Comment not found")
      }

      const response = target.isLiked
        ? await CommentService.unlikeComment(id)
        : await CommentService.likeComment(id)

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to like comment")
      }

      const newLikedState = !target.isLiked
      const newLikeCount = response.data.likeCount

      if (isReply) {
        setExpandedReplies(prev => {
          const nextState = { ...prev }
          for (const parentId of Object.keys(nextState)) {
            nextState[parentId] = nextState[parentId].map(r =>
              r.id === id ? { ...r, isLiked: newLikedState, likeCount: newLikeCount } : r
            )
          }
          return nextState
        })
      } else {
        setComments(prev =>
          prev.map(c => (c.id === id ? { ...c, isLiked: newLikedState, likeCount: newLikeCount } : c))
        )
      }
    } catch (err) {
      logError(err, { context: "Liking comment", storyId, chapterId })
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive",
      })
    } finally {
      setLikingComment(prev => ({ ...prev, [id]: false }))
    }
  }, [user, expandedReplies, comments, storyId, chapterId, router, toast])

  // ── Load / Toggle Replies ───────────────────────────────────────────────
  const loadReplies = useCallback(async (commentId: string) => {
    // If already loaded, toggle closed
    if (expandedReplies[commentId]) {
      setExpandedReplies(prev => {
        const next = { ...prev }
        delete next[commentId]
        return next
      })
      return
    }

    setLoadingReplies(prev => ({ ...prev, [commentId]: true }))

    try {
      const response = await CommentService.getReplies(
        commentId,
        { storyId, chapterId: isChapter ? chapterId : undefined },
        { page: 1, limit: 50 }
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load replies")
      }

      setExpandedReplies(prev => ({
        ...prev,
        [commentId]: response.data!.replies,
      }))
    } catch (err) {
      logError(err, { context: "Loading replies", storyId, chapterId })
      toast({
        title: "Error",
        description: "Failed to load replies",
        variant: "destructive",
      })
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }))
    }
  }, [expandedReplies, storyId, isChapter, chapterId, toast])

  const openReportDialog = useCallback((id: string) => {
    setReportingCommentId(id)
    setIsReportDialogOpen(true)
  }, [])

  const closeReportDialog = useCallback(() => {
    setIsReportDialogOpen(false)
    setReportingCommentId(null)
  }, [])

  return {
    user,
    isAuthenticated,
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
  }
}
