"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Pin, MessageSquare, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns/formatDistanceToNow"
import ForumRules from "@/components/forum/ForumRules"
import BannedUsers from "@/components/forum/BannedUsers"
import AdBanner from "@/components/ad-banner"
import { sanitizeText } from "@/utils/sanitization"

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
  bannedUsers: BannedUser[]
}

interface BannedUser {
  id: string
  name: string
  username: string
  image: string | null
}

export default function PostPageClient({ post, user, forumRules, bannedUsers }: PostPageClientProps) {
  const [displayedComments, setDisplayedComments] = useState(3)
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState([...post.comments])
  const hasMoreComments = displayedComments < comments.length

  const loadMoreComments = () => {
    setDisplayedComments(prev => Math.min(prev + 3, comments.length))
  }

  const handleComment = () => {
    if (newComment.trim() && user) {
      const sanitizedComment = sanitizeText(newComment)
      const newCommentObj = {
        id: `c${comments.length + 1}`,
        content: sanitizedComment,
        author: {
          name: user.name,
          username: user.username,
          image: user.image
        },
        createdAt: new Date()
      }

      setComments(prev => [...prev, newCommentObj])
      setNewComment("")

      // Update the count of displayed comments to include the new comment
      if (displayedComments >= comments.length) {
        setDisplayedComments(prev => prev + 1)
      }
    }
  }

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
          asDialog
        />
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Rules & Banned Users */}
        <div className="hidden lg:block lg:col-span-3 space-y-6 h-fit">
          <ForumRules rules={forumRules} />
          <BannedUsers bannedUsers={bannedUsers} />

          {/* Left Ad - Hidden on smaller screens */}
          <div className="hidden lg:block">
            <AdBanner
              type="sidebar"
              width={300}
              height={600}
              className="w-full h-auto"
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
                      />
                      <Button size="sm" className="mt-2" onClick={handleComment} disabled={!newComment.trim()}>
                        Comment
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
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3">
                          <p className="font-semibold text-sm">{comment.author.name}</p>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-3">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Horizontal Ad after every 3 comments */}
                    {(index + 1) % 3 === 0 && index + 1 < displayedComments && (
                      <Card className="bg-muted/50 my-4">
                        <CardContent className="p-4 text-center">
                          <AdBanner
                            type="banner"
                            width={728}
                            height={90}
                            className="w-full h-auto"
                          />
                        </CardContent>
                      </Card>
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
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-4">
            <AdBanner
              type="sidebar"
              width={300}
              height={600}
              className="w-full h-auto"
            />          
          </div>
        </div>
      </div>
    </div>
  )
}
