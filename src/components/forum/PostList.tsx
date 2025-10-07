"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import AdBanner from "../ad-banner"
import PostCard from "./PostCard"

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

interface PostListProps {
  user: User
  currentUserId: string | null
  posts: Post[]
  onNewPost?: (title: string, content: string) => void
  isForumOwner?: boolean
  onBanUser?: (postId: string, userId: string) => void
  onDeletePost?: (postId: string) => void
  onEditPost?: (postId: string) => void
  onTogglePin?: (postId: string) => void
}

export default function PostList({ user, currentUserId, posts, onNewPost, isForumOwner = false, onBanUser, onDeletePost, onEditPost, onTogglePin }: PostListProps) {
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())
  const [visibleComments, setVisibleComments] = useState<{ [key: string]: number }>(
    Object.fromEntries(posts.map(post => [post.id, 3])) // Show 3 comments initially
  )
  const [displayedPosts, setDisplayedPosts] = useState(5)

  const togglePostExpansion = (postId: string) => {
    const newExpanded = new Set(expandedPosts)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
      setVisibleComments({ ...visibleComments, [postId]: 3 })
    } else {
      newExpanded.add(postId)
      setVisibleComments({ ...visibleComments, [postId]: 3 })
    }
    setExpandedPosts(newExpanded)
  }

  const loadMoreComments = (postId: string, totalComments: number) => {
    const current = visibleComments[postId] || 3
    setVisibleComments({ ...visibleComments, [postId]: Math.min(current + 3, totalComments) })
  }

  const loadMorePosts = () => {
    setDisplayedPosts(prev => Math.min(prev + 5, posts.length))
  }

  // Sort posts: pinned first, then by date
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const currentUser = currentUserId && user ? { id: currentUserId, name: user.name, image: user.image } : null

  // Empty state when there are no posts
  if (!posts || posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card text-card-foreground p-10 text-center">
          <h3 className="text-xl font-semibold">No Posts</h3>
          <p className="text-sm text-muted-foreground mt-2">Create new post for your audience.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Posts List */}
      <div className="space-y-6">
        {sortedPosts.slice(0, displayedPosts).map((post, index) => {
          // Ad insertion every 5 posts
          const shouldShowAd = (index + 1) % 5 === 0 && index > 0

          return (
            <div key={post.id}>
              <PostCard
                post={post}
                forumOwnerUsername={user.username}
                isExpanded={expandedPosts.has(post.id)}
                onToggleExpansion={togglePostExpansion}
                currentUser={currentUser}
                onLoadMoreComments={loadMoreComments}
                visibleComments={visibleComments}
                isForumOwner={isForumOwner}
                onBanUser={onBanUser}
                onDeletePost={onDeletePost}
                onEditPost={onEditPost}
                onTogglePin={onTogglePin}
              />

              {/* Ad after every 5 posts */}
              {shouldShowAd && (
                <div className="sticky mt-6">
                  <AdBanner
                    type="banner"
                    className="w-full max-w-[720px] h-[90px] mx-auto"
                    slot="6596765108"
                  />                  
                </div>
              )}
            </div>
          )
        })}

        {posts.length < 5 && (
          <AdBanner
            type="banner"
            className="w-full max-w-[720px] h-[90px] mx-auto"
            slot="6596765108"
          />
        )}

        {/* Load More Posts Button */}
        {displayedPosts < posts.length && (
          <Button
            variant="outline"
            className="w-full"
            onClick={loadMorePosts}
          >
            Load More Posts ({posts.length - displayedPosts} remaining)
          </Button>
        )}
      </div>
    </div>
  )
}
