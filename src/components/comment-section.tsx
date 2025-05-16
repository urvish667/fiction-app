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
import { logError } from "@/lib/error-logger"

interface CommentSectionProps {
  storyId: string
  chapterId?: string
  isChapterComment?: boolean
}

export default function CommentSection({ storyId, chapterId, isChapterComment = false }: CommentSectionProps) {
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
  const [expandedReplies, setExpandedReplies] = useState<{[key: string]: Comment[]}>({})
  const [loadingReplies, setLoadingReplies] = useState<{[key: string]: boolean}>({})
  const [editingReply, setEditingReply] = useState<string | null>(null)
  const [editReplyContent, setEditReplyContent] = useState("")
  const [likingComment, setLikingComment] = useState<{[key: string]: boolean}>({})

  // Determine if we're in chapter comment mode
  const isChapter = isChapterComment && !!chapterId

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        let response;

        if (isChapter && chapterId) {
          // Fetch chapter comments
          response = await CommentService.getChapterComments(storyId, chapterId, {
            page: 1,
            limit: 10,
            parentId: null // Only fetch top-level comments
          });
        } else {
          // Fetch story comments
          response = await CommentService.getComments(storyId, {
            page: 1,
            limit: 10,
            parentId: null // Only fetch top-level comments
          });
        }

        setComments(response.comments)
        setHasMore(response.pagination.hasMore)
        setPage(1)
      } catch (err) {
        logError(err, { context: 'Fetching comments', storyId, chapterId })
        setError(`Failed to load ${isChapter ? 'chapter' : 'story'} comments`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchComments()
  }, [storyId, chapterId, isChapter])

  // Load more comments
  const loadMoreComments = async () => {
    if (!hasMore || isLoading) return

    try {
      setIsLoading(true)
      const nextPage = page + 1

      let response;

      if (isChapter && chapterId) {
        // Load more chapter comments
        response = await CommentService.getChapterComments(storyId, chapterId, {
          page: nextPage,
          limit: 10,
          parentId: null
        });
      } else {
        // Load more story comments
        response = await CommentService.getComments(storyId, {
          page: nextPage,
          limit: 10,
          parentId: null
        });
      }

      setComments([...comments, ...response.comments])
      setHasMore(response.pagination.hasMore)
      setPage(nextPage)
    } catch (err) {
      logError(err, { context: 'Loading more comments', storyId, chapterId })
      toast({
        title: "Error",
        description: `Failed to load more ${isChapter ? 'chapter' : 'story'} comments`,
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
      router.push(`/login?callbackUrl=/story/${storyId}${isChapter ? `/chapter/${chapterId}` : ''}`)
      return
    }

    try {
      setIsSubmitting(true)

      let createdComment;

      if (isChapter && chapterId) {
        // Create chapter comment
        createdComment = await CommentService.createChapterComment(storyId, chapterId, {
          content: newComment
        });
      } else {
        // Create story comment
        createdComment = await CommentService.createComment(storyId, {
          content: newComment
        });
      }

      // Add the new comment to the top of the list
      setComments([createdComment, ...comments])
      setNewComment("")

      toast({
        title: "Comment posted",
        description: `Your ${isChapter ? 'chapter' : 'story'} comment has been posted successfully`
      })
    } catch (err) {
      logError(err, { context: 'Submitting comment', storyId, chapterId })
      toast({
        title: "Error",
        description: `Failed to post your ${isChapter ? 'chapter' : 'story'} comment`,
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
      logError(err, { context: 'Editing comment', storyId, chapterId })
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
      logError(err, { context: 'Deleting comment', storyId, chapterId });
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

      let createdReply;

      if (isChapter && chapterId) {
        // Create chapter comment reply
        createdReply = await CommentService.createChapterComment(storyId, chapterId, {
          content: replyContent,
          parentId
        });
      } else {
        // Create story comment reply
        createdReply = await CommentService.createComment(storyId, {
          content: replyContent,
          parentId
        });
      }

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

      // If replies are already expanded for this comment, add the new reply
      if (expandedReplies[parentId]) {
        setExpandedReplies(prev => ({
          ...prev,
          [parentId]: [...prev[parentId], createdReply]
        }))
      }

      // Reset reply state
      setReplyingTo(null)
      setReplyContent("")

      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully"
      })
    } catch (err) {
      logError(err, { context: 'Replying to comment', storyId, chapterId });
      toast({
        title: "Error",
        description: "Failed to post your reply",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle like/unlike for comments and replies
  const handleLike = async (id: string, isReply: boolean = false) => {
    if (!session) {
      router.push(`/login?callbackUrl=/story/${storyId}`)
      return
    }

    // Set liking state
    setLikingComment(prev => ({ ...prev, [id]: true }))

    try {
      let result;

      // Get the comment to check if it's already liked
      const comment = isReply
        ? Object.values(expandedReplies).flat().find(reply => reply.id === id)
        : comments.find(comment => comment.id === id);

      if (!comment) {
        throw new Error("Comment not found");
      }

      // Toggle like status
      if (comment.isLiked) {
        // Unlike the comment
        result = await CommentService.unlikeComment(id);
      } else {
        // Like the comment
        result = await CommentService.likeComment(id);
      }

      // Update the UI based on the API response
      if (isReply) {
        // Update the reply in expandedReplies
        setExpandedReplies(prev => {
          const newState = { ...prev }

          // Find which comment this reply belongs to
          Object.keys(newState).forEach(commentId => {
            newState[commentId] = newState[commentId].map(reply => {
              if (reply.id === id) {
                return {
                  ...reply,
                  isLiked: !reply.isLiked,
                  likeCount: result.likeCount
                }
              }
              return reply
            })
          })

          return newState
        })
      } else {
        // Update the comment
        setComments(prev => prev.map(comment => {
          if (comment.id === id) {
            return {
              ...comment,
              isLiked: !comment.isLiked,
              likeCount: result.likeCount
            }
          }
          return comment
        }))
      }
    } catch (err) {
      logError(err, { context: 'Liking comment', storyId, chapterId });
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive"
      })
    } finally {
      setLikingComment(prev => ({ ...prev, [id]: false }))
    }
  }

  // Handle edit reply
  const handleEditReply = async (commentId: string, replyId: string) => {
    if (!editReplyContent.trim() || !session) return

    try {
      setIsSubmitting(true)

      // This would be your actual API call
      // const updatedReply = await CommentService.updateComment(replyId, {
      //   content: editReplyContent
      // })

      // For now, simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 300))

      // Update the reply in the UI
      setExpandedReplies(prev => {
        const newState = { ...prev }

        if (newState[commentId]) {
          newState[commentId] = newState[commentId].map(reply => {
            if (reply.id === replyId) {
              return {
                ...reply,
                content: editReplyContent
              }
            }
            return reply
          })
        }

        return newState
      })

      // Reset editing state
      setEditingReply(null)
      setEditReplyContent("")

      toast({
        title: "Reply updated",
        description: "Your reply has been updated successfully"
      })
    } catch (err) {
      logError(err, { context: 'Editing reply', storyId, chapterId });
      toast({
        title: "Error",
        description: "Failed to update your reply",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete reply
  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!session) return

    try {
      // This would be your actual API call
      // await CommentService.deleteComment(replyId)

      // For now, simulate a successful delete
      await new Promise(resolve => setTimeout(resolve, 300))

      // Remove the reply from the UI
      setExpandedReplies(prev => {
        const newState = { ...prev }

        if (newState[commentId]) {
          newState[commentId] = newState[commentId].filter(reply => reply.id !== replyId)
        }

        return newState
      })

      // Update the parent comment's reply count
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replyCount: Math.max((comment.replyCount || 1) - 1, 0)
          }
        }
        return comment
      }))

      toast({
        title: "Reply deleted",
        description: "Your reply has been deleted successfully"
      })
    } catch (err) {
      logError(err, { context: 'Deleting reply', storyId, chapterId })
      toast({
        title: "Error",
        description: "Failed to delete your reply",
        variant: "destructive"
      })
    }
  }

  // Load replies for a comment
  const loadReplies = async (commentId: string) => {
    // If replies are already loaded, toggle visibility instead
    if (expandedReplies[commentId]) {
      setExpandedReplies(prev => {
        const newState = {...prev}
        delete newState[commentId]
        return newState
      })
      return
    }

    // Set loading state
    setLoadingReplies(prev => ({ ...prev, [commentId]: true }))

    try {
      const response = await CommentService.getReplies(commentId, {
        page: 1,
        limit: 50 // Load a reasonable number of replies
      })

      // Store the replies
      setExpandedReplies(prev => ({
        ...prev,
        [commentId]: response.replies
      }))
    } catch (err) {
      logError(err, { context: 'Loading replies', storyId, chapterId })
      toast({
        title: "Error",
        description: "Failed to load replies",
        variant: "destructive"
      })
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }))
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
                    onClick={() => handleLike(comment.id)}
                    disabled={likingComment[comment.id]}
                  >
                    <Heart
                      size={14}
                      className={`mr-1 ${comment.isLiked ? 'fill-current text-red-500' : ''}`}
                    />
                    {likingComment[comment.id] ? 'Liking...' :
                      comment.isLiked ? `${comment.likeCount || 1} Liked` : 'Like'}
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

                {/* Show reply count and toggle button */}
                {(comment.replyCount ?? 0) > 0 && (
                  <div className="mt-2 ml-4">
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={() => loadReplies(comment.id)}
                      disabled={loadingReplies[comment.id]}
                    >
                      {loadingReplies[comment.id] ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-primary mr-2"></div>
                          Loading replies...
                        </>
                      ) : expandedReplies[comment.id] ? (
                        `Hide ${comment.replyCount ?? 0} ${(comment.replyCount ?? 0) === 1 ? "reply" : "replies"}`
                      ) : (
                        `View ${comment.replyCount ?? 0} ${(comment.replyCount ?? 0) === 1 ? "reply" : "replies"}`
                      )}
                    </Button>
                  </div>
                )}

                {/* Display replies when expanded */}
                {expandedReplies[comment.id] && expandedReplies[comment.id].length > 0 && (
                  <div className="mt-4 ml-8 space-y-4">
                    {expandedReplies[comment.id].map(reply => (
                      <div key={reply.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reply.user?.image || "/placeholder-user.jpg"} alt={reply.user?.name || "User"} />
                          <AvatarFallback>{(reply.user?.name?.[0] || "U").toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <span className="font-medium text-sm">{reply.user?.name || reply.user?.username || "Unknown User"}</span>
                                <span className="text-xs text-muted-foreground ml-2">{formatDate(reply.createdAt)}</span>
                              </div>

                              {/* Reply dropdown menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical size={14} />
                                    <span className="sr-only">More</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Flag size={14} className="mr-2" />
                                    Report
                                  </DropdownMenuItem>
                                  {session?.user?.id === reply.userId && (
                                    <>
                                      <DropdownMenuItem onClick={() => {
                                        setEditingReply(reply.id);
                                        setEditReplyContent(reply.content);
                                      }}>
                                        <Edit size={14} className="mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => handleDeleteReply(comment.id, reply.id)}
                                      >
                                        <Trash size={14} className="mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Reply content - show edit form if editing */}
                            {editingReply === reply.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editReplyContent}
                                  onChange={(e) => setEditReplyContent(e.target.value)}
                                  className="resize-none text-sm"
                                  disabled={isSubmitting}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setEditingReply(null);
                                      setEditReplyContent("");
                                    }}
                                    disabled={isSubmitting}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleEditReply(comment.id, reply.id)}
                                    disabled={!editReplyContent.trim() || isSubmitting}
                                  >
                                    {isSubmitting ? "Saving..." : "Save"}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm">{reply.content}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 ml-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleLike(reply.id, true)}
                              disabled={likingComment[reply.id]}
                            >
                              <Heart
                                size={12}
                                className={`mr-1 ${reply.isLiked ? 'fill-current text-red-500' : ''}`}
                              />
                              {likingComment[reply.id] ? 'Liking...' :
                                reply.isLiked ? `${reply.likeCount || 1} Liked` : 'Like'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
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

