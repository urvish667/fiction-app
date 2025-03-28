"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Heart, MoreVertical, Flag, Trash, Reply } from "lucide-react"
import type { Comment } from "@/lib/types"
import { sampleComments } from "@/lib/sample-comments"

interface CommentSectionProps {
  storyId: number
}

export default function CommentSection({ storyId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(true) // For demo purposes

  // Fetch comments
  useEffect(() => {
    // In a real app, this would be an API call
    const fetchComments = () => {
      setIsLoading(true)

      // Simulate API delay
      setTimeout(() => {
        // Filter comments for this story
        const storyComments = sampleComments.filter((c) => c.storyId === storyId)
        setComments(storyComments)
        setIsLoading(false)
      }, 1000)
    }

    fetchComments()
  }, [storyId])

  // Handle comment submission
  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    // In a real app, this would be an API call
    const newCommentObj: Comment = {
      id: Date.now(),
      storyId,
      userId: 999, // Current user ID
      username: "You",
      userAvatar: "/placeholder-user.jpg",
      content: newComment,
      likes: 0,
      date: new Date(),
      replies: [],
    }

    setComments([newCommentObj, ...comments])
    setNewComment("")
  }

  // Handle like comment
  const handleLikeComment = (commentId: number) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.likes + 1,
          }
        }
        return comment
      }),
    )
  }

  // Format date
  const formatDate = (date: Date) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comment form */}
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src="/placeholder-user.jpg" alt="Your Avatar" />
          <AvatarFallback>YA</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={isLoggedIn ? "Add a comment..." : "Login to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!isLoggedIn}
            className="resize-none"
          />

          {isLoggedIn && (
            <div className="flex justify-end">
              <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                Post Comment
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
                <AvatarImage src={comment.userAvatar} alt={comment.username} />
                <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{comment.username}</span>
                      <span className="text-xs text-muted-foreground ml-2">{formatDate(comment.date)}</span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={16} />
                          <span className="sr-only">More</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Reply size={16} className="mr-2" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Flag size={16} className="mr-2" />
                          Report
                        </DropdownMenuItem>
                        {comment.username === "You" && (
                          <DropdownMenuItem className="text-destructive">
                            <Trash size={16} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
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
                    onClick={() => handleLikeComment(comment.id)}
                  >
                    <Heart size={14} className="mr-1" />
                    {comment.likes > 0 ? comment.likes : "Like"}
                  </Button>

                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                    <Reply size={14} className="mr-1" />
                    Reply
                  </Button>
                </div>

                {/* Comment replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-4 space-y-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reply.userAvatar} alt={reply.username} />
                          <AvatarFallback>{reply.username.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="bg-muted/20 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <span className="font-medium text-sm">{reply.username}</span>
                                <span className="text-xs text-muted-foreground ml-2">{formatDate(reply.date)}</span>
                              </div>
                            </div>

                            <p className="text-sm">{reply.content}</p>
                          </div>

                          <div className="flex items-center gap-2 mt-1 ml-2">
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                              <Heart size={12} className="mr-1" />
                              {reply.likes > 0 ? reply.likes : "Like"}
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
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
}

