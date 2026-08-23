"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AdBanner } from "@/components/common"
import { PostCard } from "./post-card"
import type { PostListProps } from "../types/forum.types"

export function PostList({
  user,
  currentUserId,
  posts,
  onNewPost,
  isForumOwner = false,
  onBanUser,
  onDeletePost,
  onEditPost,
  onTogglePin,
}: PostListProps) {
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())
  const [visibleComments, setVisibleComments] = useState<{ [key: string]: number }>(
    Object.fromEntries(posts.map((post) => [post.id, 3]))
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
    setDisplayedPosts((prev) => Math.min(prev + 5, posts.length))
  }

  // Sort posts: pinned first, then by date descending
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const currentUser = currentUserId && user ? { id: currentUserId, name: user.name, image: user.image } : null

  // Guard: Empty state when there are no posts
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
      <div className="space-y-6">
        {sortedPosts.slice(0, displayedPosts).map((post, index) => {
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

              {shouldShowAd && (
                <div className="mt-6 w-full">
                  <AdBanner
                    type="banner"
                    className="w-full"
                    slot="6596765108"
                  />
                </div>
              )}
            </div>
          )
        })}

        {posts.length < 5 && (
          <div className="w-full py-2">
            <AdBanner
              type="banner"
              className="w-full"
              slot="6596765108"
            />
          </div>
        )}

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

export default PostList
