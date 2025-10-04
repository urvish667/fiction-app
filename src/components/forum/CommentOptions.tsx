"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Flag } from "lucide-react"
import ConfirmationDialog from "./ConfirmationDialog"
import { ReportDialog } from "@/components/report/ReportDialog"

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    username: string
    image: string | null
  }
  createdAt: Date
}

interface CommentOptionsProps {
  comment: Comment
  forumOwnerUsername: string
  postId: string
  currentUserId: string | null
  isForumOwner: boolean
  onEditComment?: (commentId: string) => void
  onDeleteComment?: (commentId: string) => void
}

export default function CommentOptions({
  comment,
  forumOwnerUsername,
  postId,
  currentUserId,
  isForumOwner,
  onEditComment,
  onDeleteComment,
}: CommentOptionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canEdit = currentUserId === comment.author.id
  const canDelete = currentUserId === comment.author.id || isForumOwner
  const canReport = currentUserId !== null && currentUserId !== comment.author.id

  const handleDelete = async () => {
    if (!onDeleteComment) return

    setIsDeleting(true)
    try {
      await onDeleteComment(comment.id)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Don't render if user has no available actions
  if (!currentUserId || (!canEdit && !canDelete && !canReport)) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
            <span className="sr-only">Comment options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEditComment?.(comment.id)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          {canReport && (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowReportDialog(true)
              }}
            >
              <Flag className="h-4 w-4 mr-2" />
              Report
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowDeleteDialog(true)
              }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText={isDeleting ? undefined : "Delete"}
        onConfirm={handleDelete}
        variant="destructive"
        loading={isDeleting}
      />

      {/* Report Dialog */}
      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        postId={null}
        storyId={null}
        commentId={null}
        forumCommentId={comment.id}
        reportedUserId={comment.author.id}
      />
    </>
  )
}
