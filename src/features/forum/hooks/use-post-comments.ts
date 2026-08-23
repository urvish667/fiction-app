"use client"

import { useState, useCallback } from "react"
import { ForumService } from "@/lib/api/forum"
import { toast } from "@/hooks/use-toast"
import { logError } from "@/lib/error-logger"
import type { ForumComment } from "../types/forum.types"

export function usePostComments(username: string, postId: string, initialComments: ForumComment[]) {
  const [comments, setComments] = useState<ForumComment[]>([...initialComments])
  const [submittingComment, setSubmittingComment] = useState(false)
  const [updatingComment, setUpdatingComment] = useState(false)

  const createComment = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || submittingComment) return false

      setSubmittingComment(true)
      try {
        const response = await ForumService.createComment(username, postId, {
          content: trimmed,
        })

        if (!response.success || !response.data) {
          toast({
            title: "Error",
            description: response.message || "Failed to post comment",
            variant: "destructive",
          })
          return false
        }

        const newCommentObj: ForumComment = {
          id: response.data.id,
          content: response.data.content,
          createdAt: new Date(response.data.createdAt),
          editedAt: response.data.editedAt ? new Date(response.data.editedAt) : undefined,
          author: {
            id: response.data.user.id,
            name: response.data.user.name,
            username: response.data.user.username,
            image: response.data.user.image,
          },
        }

        setComments((prev) => [newCommentObj, ...prev])
        toast({
          title: "Success",
          description: "Comment posted successfully",
        })
        return true
      } catch (err) {
        logError(err, { context: "Posting forum comment" })
        toast({
          title: "Error",
          description: "Failed to post comment",
          variant: "destructive",
        })
        return false
      } finally {
        setSubmittingComment(false)
      }
    },
    [username, postId, submittingComment]
  )

  const updateComment = useCallback(
    async (commentId: string, content: string) => {
      const trimmed = content.trim()
      if (!commentId || !trimmed || updatingComment) return false

      setUpdatingComment(true)
      try {
        const response = await ForumService.updateComment(username, postId, commentId, {
          content: trimmed,
        })

        if (!response.success || !response.data) {
          toast({
            title: "Error",
            description: response.message || "Failed to update comment",
            variant: "destructive",
          })
          return false
        }

        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  content: response.data!.content,
                  editedAt: response.data!.editedAt ? new Date(response.data!.editedAt) : undefined,
                }
              : c
          )
        )
        toast({
          title: "Success",
          description: "Comment updated successfully",
        })
        return true
      } catch (err) {
        logError(err, { context: "Updating forum comment" })
        toast({
          title: "Error",
          description: "Failed to update comment",
          variant: "destructive",
        })
        return false
      } finally {
        setUpdatingComment(false)
      }
    },
    [username, postId, updatingComment]
  )

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!commentId) return false

      try {
        const response = await ForumService.deleteComment(username, postId, commentId)

        if (!response.success) {
          toast({
            title: "Error",
            description: response.message || "Failed to delete comment",
            variant: "destructive",
          })
          return false
        }

        setComments((prev) => prev.filter((c) => c.id !== commentId))
        toast({
          title: "Success",
          description: "Comment deleted successfully",
        })
        return true
      } catch (err) {
        logError(err, { context: "Deleting forum comment" })
        toast({
          title: "Error",
          description: "Failed to delete comment",
          variant: "destructive",
        })
        return false
      }
    },
    [username, postId]
  )

  return {
    comments,
    setComments,
    submittingComment,
    updatingComment,
    createComment,
    updateComment,
    deleteComment,
  }
}

export default usePostComments
