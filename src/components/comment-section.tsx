"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Heart, MoreVertical, Flag, Trash, Reply, Edit, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { CommentService } from "@/services/comment-service"
import { Comment } from "@/types/story"

interface CommentSectionProps {
  storyId: string
}

export default function CommentSection({ storyId }: CommentSectionProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await CommentService.getComments(storyId, {
          page: 1,
          limit: 10,
          parentId: null // Only fetch top-level comments
        })

        setComments(response.comments)
        setHasMore(response.pagination.hasMore)
        setPage(1)
      } catch (err) {
        console.error("Error fetching comments:", err)
        setError("Failed to load comments")
      } finally {
        setIsLoading(false)
      }
    }

    fetchComments()
  }, [storyId])

  // Load more comments
  const loadMoreComments = async () => {
    if (!hasMore || isLoading) return

    try {
      setIsLoading(true)
      const nextPage = page + 1

      const response = await CommentService.getComments(storyId, {
        page: nextPage,
        limit: 10,
        parentId: null
      })

      setComments([...comments, ...response.comments])
      setHasMore(response.pagination.hasMore)
      setPage(nextPage)
    } catch (err) {
      console.error("Error loading more comments:", err)
      toast({
        title: "Error",
        description: "Failed to load more comments",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    if (!session) {
      router.push(`/login?callbackUrl=/story/${storyId}`)
      return
    }

    try {
      setIsSubmitting(true)

      const createdComment = await CommentService.createComment(storyId, {
        content: newComment
      })

      // Add the new comment to the top of the list
      setComments([createdComment, ...comments])
      setNewComment("")

      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully"
      })
    } catch (err) {
      console.error("Error posting comment:", err)
      toast({
        title: "Error",
        description: "Failed to post your comment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit comment
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || !session) return

    try {
      setIsSubmitting(true)

      const updatedComment = await CommentService.updateComment(commentId, {
        content: editContent
      })

      // Update the comment in the list
      setComments(comments.map(comment =>
        comment.id === commentId ? updatedComment : comment
      ))

      // Reset editing state
      setEditingComment(null)
      setEditContent("")

      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully"
      })
    } catch (err) {
      console.error("Error updating comment:", err)
      toast({
        title: "Error",
        description: "Failed to update your comment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!session) return

    try {
      await CommentService.deleteComment(commentId)

      // Remove the comment from the list
      setComments(comments.filter(comment => comment.id !== commentId))

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully"
      })
    } catch (err) {
      console.error("Error deleting comment:", err)
      toast({
        title: "Error",
        description: "Failed to delete your comment",
        variant: "destructive"
      })
    }
  }

  // Handle reply to comment
  const handleReplyToComment = async (parentId: string) => {
    if (!replyContent.trim() || !session) return

    try {
      setIsSubmitting(true)

      const createdReply = await CommentService.createComment(storyId, {
        content: replyContent,
        parentId
      })

      // Update the parent comment's reply count
      setComments(comments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replyCount: (comment.replyCount || 0) + 1
          }
        }
        return comment
      }))

      // Reset reply state
      setReplyingTo(null)
      setReplyContent("")

      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully"
      })
    } catch (err) {
      console.error("Error posting reply:", err)
      toast({
        title: "Error",
        description: "Failed to post your reply",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date
  const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
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
      {/* Comment form */}
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={session?.user?.image || "/placeholder-user.jpg"} alt="Your Avatar" />
          <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={session ? "Add a comment..." : "Login to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!session || isSubmitting}
            className="resize-none"
          />

          {session && (
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.user?.image || "/placeholder-user.jpg"} alt={comment.user?.name || "User"} />
                <AvatarFallback>{(comment.user?.name?.[0] || "U").toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{comment.user?.name || comment.user?.username || "Unknown User"}</span>
                      <span className="text-xs text-muted-foreground ml-2">{formatDate(comment.createdAt)}</span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={16} />
                          <span className="sr-only">More</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          if (!session) {
                            router.push(`/login?callbackUrl=/story/${storyId}`);
                            return;
                          }
                          setReplyingTo(comment.id);
                          setReplyContent("");
                        }}>
                          <Reply size={16} className="mr-2" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Flag size={16} className="mr-2" />
                          Report
                        </DropdownMenuItem>
                        {session?.user?.id === comment.userId && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setEditingComment(comment.id);
                              setEditContent(comment.content);
                            }}>
                              <Edit size={16} className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash size={16} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm">{comment.content}</p>
                </div>

                <div className="flex items-center gap-2 mt-2 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      if (!session) {
                        router.push(`/login?callbackUrl=/story/${storyId}`);
                        return;
                      }
                      // Like functionality would go here
                    }}
                  >
                    <Heart size={14} className="mr-1" />
                    Like
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      if (!session) {
                        router.push(`/login?callbackUrl=/story/${storyId}`);
                        return;
                      }
                      setReplyingTo(comment.id);
                      setReplyContent("");
                    }}
                  >
                    <Reply size={14} className="mr-1" />
                    Reply
                  </Button>
                </div>

                {/* Reply form */}
                {replyingTo === comment.id && (
                  <div className="mt-2 ml-4">
                    <div className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session?.user?.image || "/placeholder-user.jpg"} alt="Your Avatar" />
                        <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
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
                            onClick={() => handleReplyToComment(comment.id)}
                            disabled={!replyContent.trim() || isSubmitting}
                          >
                            {isSubmitting ? "Posting..." : "Reply"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show reply count */}
                {comment.replyCount > 0 && (
                  <div className="mt-2 ml-4">
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={() => {
                        // Load replies functionality would go here
                      }}
                    >
                      View {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Load more comments button */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={loadMoreComments}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2"></div>
                    Loading...
                  </>
                ) : (
                  "Load More Comments"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
}

