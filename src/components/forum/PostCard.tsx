"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pin, MessageSquare, MoreHorizontal, Ban, Edit, Trash2, Flag, Share2, Twitter, Facebook, LinkIcon, Check } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns/formatDistanceToNow"
import Link from "next/link"
import ConfirmationDialog from "./ConfirmationDialog"
import { ReportDialog } from "@/components/report/ReportDialog"

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
    name: string
    username: string
    image: string | null
  }
  createdAt: Date
}

interface Post {
  id: string
  title: string
  slug: string
  content: string
  author: {
    id: string
    name: string
    username: string
    image: string | null
  }
  pinned: boolean
  createdAt: Date
  commentCount: number
  comments: Comment[]
}

interface PostCardProps {
  post: Post
  forumOwnerUsername: string
  isExpanded: boolean
  onToggleExpansion: (postId: string) => void
  currentUser: {
    id: string
    name: string
    image: string | null
  } | null
  onLoadMoreComments: (postId: string, totalComments: number) => void
  visibleComments: { [key: string]: number }
  isForumOwner: boolean
  onBanUser?: (postId: string, userId: string) => void
  onDeletePost?: (postId: string) => void
  onEditPost?: (postId: string) => void
  onTogglePin?: (postId: string) => void
}

export default function PostCard({ post, forumOwnerUsername, isExpanded, onToggleExpansion, currentUser, onLoadMoreComments, visibleComments, isForumOwner, onBanUser, onDeletePost, onEditPost, onTogglePin }: PostCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBanning, setIsBanning] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://fablespace.space/user/${forumOwnerUsername}/forum/comment/${post.slug}`)
    setCopied(true)
    toast({
      title: "Link Copied",
      description: "Post link copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform: string) => {
    toast({
      title: "Sharing",
      description: `Sharing to ${platform}...`,
    })
  }

  // Function to truncate HTML content to a specified number of words
  const truncateContent = (htmlContent: string, maxWords: number = 30) => {
    // Strip HTML tags
    const textContent = htmlContent.replace(/<[^>]+>/g, '').trim()
    const words = textContent.split(/\s+/)
    if (words.length <= maxWords) {
      return htmlContent
    }
    const truncatedText = words.slice(0, maxWords).join(' ') + '...'
    return `<p>${truncatedText}</p>`
  }

  return (
    <>
    <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
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
          {/* Three-dot menu */}
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentUser.id === post.author.id && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onEditPost?.(post.id)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isForumOwner && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onTogglePin?.(post.id)
                    }}
                  >
                    <Pin className="h-4 w-4 mr-2" />
                    {post.pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                )}
                {isForumOwner && currentUser.id !== post.author.id && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowBanDialog(true)
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban
                  </DropdownMenuItem>
                )}
                {currentUser.id !== post.author.id && (
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
                {(currentUser.id === post.author.id || isForumOwner) && (
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
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Link href={`/user/${forumOwnerUsername}/forum/comment/${post.slug}`}>
          <h2 className="text-lg font-semibold mb-3 cursor-pointer hover:text-primary transition-colors">{post.title}</h2>
        </Link>
        {post.content && post.content.trim() ? (
          <div className="text-sm mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: truncateContent(post.content) }} />
        ) : (
          <div className="text-sm mb-4 text-muted-foreground italic">
            [Content not available]
          </div>
        )}

        {/* Comments Section */}
        <div className="border-t pt-4 mt-4 cursor-pointer">
          <div className="flex items-center justify-between mb-4" onClick={() => window.location.href = `/user/${forumOwnerUsername}/forum/comment/${post.slug}`}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>{post.commentCount} Comments</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleShare("Twitter")}>
                  <Twitter size={16} className="mr-2" />
                  Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare("Facebook")}>
                  <Facebook size={16} className="mr-2" />
                  Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  {copied ? (
                    <>
                      <Check size={16} className="mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <LinkIcon size={16} className="mr-2" />
                      Copy Link
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Confirmation dialogs */}
    <ConfirmationDialog
      open={showDeleteDialog}
      onOpenChange={setShowDeleteDialog}
      title="Delete Post"
      message="Are you sure you want to delete this post? This action cannot be undone."
      confirmText={isDeleting ? undefined : "Delete"}
      onConfirm={async () => {
        setIsDeleting(true)
        try {
          await onDeletePost?.(post.id)
        } finally {
          setIsDeleting(false)
        }
      }}
      variant="destructive"
      loading={isDeleting}
    />

    <ConfirmationDialog
      open={showBanDialog}
      onOpenChange={setShowBanDialog}
      title="Ban User"
      message={`Are you sure you want to ban ${post.author.username} from this forum?`}
      confirmText={isBanning ? undefined : "Ban"}
      onConfirm={async () => {
        setIsBanning(true)
        try {
          await onBanUser?.(post.id, post.author.id)
        } finally {
          setIsBanning(false)
        }
      }}
      variant="destructive"
      loading={isBanning}
    />

    <ReportDialog
      isOpen={showReportDialog}
      onClose={() => setShowReportDialog(false)}
      postId={post.id}
      storyId={null}
      commentId={null}
      forumCommentId={null}
      reportedUserId={null}
    />
    </>
  )
}
