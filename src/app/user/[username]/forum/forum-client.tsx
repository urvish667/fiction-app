"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import PostList from "@/components/forum/PostList"
import ForumRules from "@/components/forum/ForumRules"
import BannedUsers from "@/components/forum/BannedUsers"
import EditPostDialog from "@/components/forum/EditPostDialog"
import InstructionForum from "@/components/forum/InstructionForum"
import { Loader2, ArrowLeft, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import AdBanner from "@/components/ad-banner"

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

interface BannedUser {
  id: string
  name: string
  username: string
  image: string | null
}

interface ForumClientProps {
  user: User
  forumId: string | null
  isOwner: boolean
  currentUserId: string | null
}

const forumRules = [
  "Be respectful to all members",
  "No spam or self-promotion",
  "Use appropriate language",
  "Stay on topic",
  "No harassment or bullying",
  "Respect author's creative choices"
]

export default function ForumClient({ user, forumId, isOwner, currentUserId }: ForumClientProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBannedUsers, setLoadingBannedUsers] = useState(false)
  const [creatingPost, setCreatingPost] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [createPostMode, setCreatePostMode] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string>('')

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/forum/${user.username}/posts`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Transform createdAt dates to Date objects
          const transformedPosts = data.posts.map((post: any) => ({
            ...post,
            createdAt: new Date(post.createdAt)
          }))
          setPosts(transformedPosts)
        }
      } else if (response.status === 403) {
        // Forum not enabled - return empty posts
        setPosts([])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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

  // Handle ban user
  const handleBanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/forum/${user.username}/ban/${userId}`, {
        method: 'PUT',
        headers: {
          'x-csrf-token': csrfToken,
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "User has been banned from this forum"
        })

        // Refresh banned users list if needed
        await fetchBannedUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to ban user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error banning user:', error)
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive"
      })
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

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/forum/${user.username}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
        },
      })

      if (response.ok) {
        // Remove from local state
        setPosts(prev => prev.filter(post => post.id !== postId))
        toast({
          title: "Success",
          description: "Post has been deleted"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete post",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      })
    }
  }

  // Handle edit post - open edit dialog
  const handleEditPost = (postId: string) => {
    const postToEdit = posts.find(post => post.id === postId)
    if (postToEdit) {
      setEditingPost(postToEdit)
    }
  }

  // Handle post save - for both create and edit
  const handlePostSave = async (postId: string | undefined, title: string, content: string) => {
    if (postId) {
      // Edit existing post
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, title, content }
            : post
        )
      )
    } else {
      // Create new post - added to API response
      await fetchPosts()
    }
  }

  // Handle toggle pin
  const handleTogglePin = async (postId: string) => {
    try {
      const response = await fetch(`/api/forum/${user.username}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          action: 'toggle' // Use toggle action
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update local state to reflect the new pinned status
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, pinned: data.pinned }
              : post
          )
        )

        toast({
          title: "Success",
          description: data.pinned ? "Post pinned successfully" : "Post unpinned successfully"
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to toggle pin status",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error toggling pin status:', error)
      toast({
        title: "Error",
        description: "Failed to toggle pin status",
        variant: "destructive"
      })
    }
  }

  // Handle create post - open dialog in create mode
  const handleCreatePost = () => {
    setCreatePostMode(true)
  }

  useEffect(() => {
    const initializeForum = async () => {
      await setupCsrfToken()
      await fetchPosts()
      logger.info('ForumClient: Fetching banned users (visible to everyone)')
      await fetchBannedUsers()
    }
    initializeForum()
  }, [user.username, isOwner])

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading forum...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">The {user.username} Community</h1>
        <Link href={`/user/${user.username}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Author Profile
        </Link>
      </div>

      {/* Mobile buttons for rules, banned users, create post, and instructions - Only visible on smaller screens */}
      <div className="flex flex-wrap gap-2 mb-6 lg:hidden">
        <ForumRules rules={forumRules} asDialog />

        <BannedUsers
          bannedUsers={bannedUsers}
          loadingBannedUsers={loadingBannedUsers}
          isOwner={isOwner}
          onUnban={isOwner ? handleUnbanUser : undefined}
          asDialog
        />

        {currentUserId && (
          <Button onClick={handleCreatePost} className="rounded-3xl">
            <div className="border border-white rounded-full p-1 mr-2">
              <Plus className="h-4 w-4" />
            </div>
            Create Post
          </Button>
        )}

        <InstructionForum asDialog />
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Rules & Banned Users */}
        <div className="hidden lg:block lg:col-span-3 space-y-6 h-fit">
          <ForumRules rules={forumRules} />

          {/* Banned Users - Visible to everyone, unban button only for owner */}
          <BannedUsers
            bannedUsers={bannedUsers}
            loadingBannedUsers={loadingBannedUsers}
            isOwner={isOwner}
            onUnban={isOwner ? handleUnbanUser : undefined}
          />

          {/* Left Ad - Hidden on smaller screens */}
          <div className="hidden lg:block">
            <div className="sticky top-16">
              <AdBanner
                type="sidebar"
                width={300}
                height={600}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Middle Section - Posts */}
        <div className="lg:col-span-6">
          <PostList
            user={user}
            currentUserId={currentUserId}
            posts={posts}
            isForumOwner={isOwner}
            onBanUser={isOwner ? (postId: string, userId: string) => handleBanUser(userId) : undefined}
            onDeletePost={isOwner || currentUserId ? (postId: string) => handleDeletePost(postId) : undefined}
            onEditPost={currentUserId ? (postId: string) => handleEditPost(postId) : undefined}
            onTogglePin={isOwner ? (postId: string) => handleTogglePin(postId) : undefined}
          />
        </div>

        {/* Right Sidebar - Ad Space - Hidden on smaller screens */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          {currentUserId && (
            <div className="flex justify-end mb-4">
              <Button onClick={handleCreatePost} className="rounded-3xl">
                <div className="border border-white rounded-full p-1 mr-0">
                  <Plus className="h-4 w-4" />
                </div>
                Create Post
              </Button>
            </div>
          )}

          <InstructionForum />

          <div className="sticky top-16">
            <AdBanner
              type="sidebar"
              width={300}
              height={600}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* Edit Post Dialog */}
      <EditPostDialog
        post={editingPost}
        mode={editingPost ? 'edit' : createPostMode ? 'create' : 'edit'}
        open={!!editingPost || createPostMode}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setEditingPost(null)
            setCreatePostMode(false)
          }
        }}
        onSave={handlePostSave}
        csrfToken={csrfToken}
        username={user.username}
      />
    </div>
  )
}
