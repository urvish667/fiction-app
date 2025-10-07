"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Pin, MessageSquare, ArrowLeft, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns/formatDistanceToNow"
import ForumRules from "@/components/forum/ForumRules"
import BannedUsers from "@/components/forum/BannedUsers"
import AdBanner from "@/components/ad-banner"
import CommentOptions from "@/components/forum/CommentOptions"
import InstructionForum from "@/components/forum/InstructionForum"

interface User {
  id: string
  name: string
  username: string
  image: string | null
}

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
  editedAt?: Date
}

interface Post {
  id: string
  title: string
  content: string
  author: User
  pinned: boolean
  createdAt: Date
  commentCount: number
  comments: Comment[]
}

interface PostPageClientProps {
  post: Post
  user: User
  forumRules: string[]
  isOwner: boolean
  currentUserId: string | null
}

interface BannedUser {
  id: string
  name: string
  username: string
  image: string | null
}

export default function PostPageClient({ post, user, forumRules, isOwner, currentUserId }: PostPageClientProps) {
  const [displayedComments, setDisplayedComments] = useState(3)
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState([...post.comments])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [loadingBannedUsers, setLoadingBannedUsers] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string>('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [updatingComment, setUpdatingComment] = useState(false)
  const hasMoreComments = displayedComments < comments.length

  const loadMoreComments = () => {
    setDisplayedComments(prev => Math.min(prev + 3, comments.length))
  }

  const handleComment = async () => {
    if (newComment.trim() && user && !submittingComment) {
      setSubmittingComment(true)
      try {
        const response = await fetch(`/api/forum/${user.username}/posts/${post.id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken && { 'x-csrf-token': csrfToken })
          },
          body: JSON.stringify({ content: newComment.trim() })
        })

        if (response.ok) {
          const data = await response.json()
          const newCommentObj = {
            id: data.comment.id,
            content: data.comment.content,
            createdAt: data.comment.createdAt,
            editedAt: data.comment.editedAt,
            author: data.comment.author
          }

          setComments(prev => [newCommentObj, ...prev]) // Add to beginning since we reverse display
          setNewComment("")

          // Update the count of displayed comments to include the new comment
          if (displayedComments >= comments.length) {
            setDisplayedComments(prev => prev + 1)
          }

          toast({
            title: "Success",
            description: "Comment posted successfully"
          })
        } else {
          const error = await response.json()
          toast({
            title: "Error",
            description: error.message || "Failed to post comment",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error posting comment:', error)
        toast({
          title: "Error",
          description: "Failed to post comment",
          variant: "destructive"
        })
      } finally {
        setSubmittingComment(false)
      }
    }
  }

  // Fetch CSRF token
  const setupCsrfToken = async () => {
    try {
      const response = await fetch('/api/csrf/setup')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.token) {
          setCsrfToken(data.token)
        }
      }
    } catch (error) {
      console.error('Error setting up CSRF token:', error)
    }
  }

  // Fetch banned users (visible to everyone)
  const fetchBannedUsers = async () => {
    setLoadingBannedUsers(true)
    try {
      const response = await fetch(`/api/forum/${user.username}/banned-users`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setBannedUsers(data.bannedUsers)
        }
      } else if (response.status === 403) {
        // No permission to view banned users
        setBannedUsers([])
      }
    } catch (error) {
      console.error('Error fetching banned users:', error)
      setBannedUsers([])
    } finally {
      setLoadingBannedUsers(false)
    }
  }

  // Handle unban user
  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/forum/${user.username}/ban/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
        },
      })

      if (response.ok) {
        // Remove from local state
        setBannedUsers(prev => prev.filter(user => user.id !== userId))
        toast({
          title: "Success",
          description: "User has been unbanned"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to unban user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error unbanning user:', error)
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive"
      })
    }
  }

  // Handle edit comment
  const handleEditComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    if (comment) {
      setEditingCommentId(commentId)
      setEditingCommentContent(comment.content)
    }
  }

  // Handle save edited comment
  const handleSaveEditComment = async () => {
    if (!editingCommentId || !editingCommentContent.trim()) return

    setUpdatingComment(true)
    try {
      const response = await fetch(`/api/forum/${user.username}/posts/${post.id}/comments/${editingCommentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken })
        },
        body: JSON.stringify({ content: editingCommentContent.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => prev.map(comment =>
          comment.id === editingCommentId
            ? {
                ...comment,
                content: data.comment.content,
                editedAt: data.comment.editedAt
              }
            : comment
        ))
        setEditingCommentId(null)
        setEditingCommentContent('')
        toast({
          title: "Success",
          description: "Comment updated successfully"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to update comment",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive"
      })
    } finally {
      setUpdatingComment(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingCommentContent('')
  }

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/forum/${user.username}/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          ...(csrfToken && { 'x-csrf-token': csrfToken })
        }
      })

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId))
        toast({
          title: "Success",
          description: "Comment deleted successfully"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to delete comment",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    const initializePostPage = async () => {
      await setupCsrfToken()
      await fetchBannedUsers()
    }
    initializePostPage()
  }, [user.username])

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">The {user.username} Community</h1>
        <Link href={`/user/${user.username}/forum`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to forum
        </Link>
      </div>

      {/* Mobile buttons for rules and banned users - Only visible on smaller screens */}
      <div className="flex gap-2 mb-6 lg:hidden">
        <ForumRules rules={forumRules} asDialog />
      
        <BannedUsers
          bannedUsers={bannedUsers}
          loadingBannedUsers={loadingBannedUsers}
          isOwner={isOwner}
          onUnban={isOwner ? handleUnbanUser : undefined}
          asDialog
        />

         <InstructionForum asDialog />
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Rules & Banned Users */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <ForumRules rules={forumRules} />
          
          <BannedUsers
            bannedUsers={bannedUsers}
            loadingBannedUsers={loadingBannedUsers}
            isOwner={isOwner}
            onUnban={isOwner ? handleUnbanUser : undefined}
          />

          <div className="sticky top-16">
            <AdBanner
              type="sidebar"
              width={300}
              height={600}
              slot="3146074170"
            />      
          </div>
        </div>

        {/* Middle Section - Single Post */}
        <div className="lg:col-span-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar>
                    <AvatarImage src={post.author.image || undefined} />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{post.author.username}</p>
                      {post.pinned && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
              <div className="text-sm mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="mt-6">
            <Card>
              <CardContent className="space-y-4">
                {/* Comment Input at Top */}
                {user && (
                  <div className="flex gap-3 border-b pb-4 mt-6">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[60px] text-sm"
                        maxLength={2000}
                        disabled={submittingComment}
                      />
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={handleComment}
                        disabled={!newComment.trim() || submittingComment}
                      >
                        {submittingComment ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          'Comment'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Smaller Comment Count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{comments.length} Comments</span>
                </div>

                {/* Comments List - Latest First */}
                {comments.slice(0, displayedComments).reverse().map((comment, index) => (
                  <div key={comment.id}>
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author.image || undefined} />
                        <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 relative">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">{comment.author.name}</p>
                            <CommentOptions
                              comment={comment}
                              forumOwnerUsername={user.username}
                              postId={post.id}
                              currentUserId={currentUserId}
                              isForumOwner={isOwner}
                              onEditComment={handleEditComment}
                              onDeleteComment={handleDeleteComment}
                            />
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="mt-2">
                              <Textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                className="min-h-[80px] text-sm"
                                maxLength={3000}
                                disabled={updatingComment}
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveEditComment}
                                  disabled={!editingCommentContent.trim() || updatingComment}
                                >
                                  {updatingComment ? (
                                    <>
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    'Save'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  disabled={updatingComment}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm mt-1">{comment.content}</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-3">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                          {comment.editedAt && (
                            <span className="ml-1">(edited {formatDistanceToNow(comment.editedAt, { addSuffix: true })})</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Horizontal Ad after every 3 comments */}
                    {(index + 1) % 3 === 0 && index + 1 < displayedComments && (
                      <AdBanner
                        type="banner"
                        className="w-full max-w-[720px] h-[90px] mx-auto"
                        slot="6596765108"
                      />
                    )}
                  </div>
                ))}



                {hasMoreComments && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={loadMoreComments}
                  >
                    Load More Comments ({comments.length - displayedComments} remaining)
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar - Ad Space - Hidden on smaller screens */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <InstructionForum />

          <div className="sticky top-16">
            <AdBanner
              type="sidebar"
              width={300}
              height={600}
              slot="3146074170"
            />          
          </div>
        </div>
      </div>
    </div>
  )
}
