"use client"

import { useState, useCallback, useEffect } from "react"
import { ForumService } from "@/lib/api/forum"
import { toast } from "@/hooks/use-toast"
import { logError } from "@/lib/error-logger"
import type { ForumPost, BannedUser } from "../types/forum.types"

export function useForumPosts(username: string) {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBannedUsers, setLoadingBannedUsers] = useState(false)

  const fetchPosts = useCallback(async () => {
    if (!username) return

    try {
      const response = await ForumService.getPosts(username)
      if (response.success && response.data) {
        const transformedPosts: ForumPost[] = response.data.posts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          author: post.author,
          pinned: post.pinned,
          createdAt: new Date(post.createdAt),
          commentCount: post._count.comments,
          comments: [],
        }))
        setPosts(transformedPosts)
        return
      }

      setPosts([])
    } catch (err) {
      logError(err, { context: "Fetching forum posts" })
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [username])

  const fetchBannedUsers = useCallback(async () => {
    if (!username) return

    setLoadingBannedUsers(true)
    try {
      const response = await ForumService.getBannedUsers(username)
      if (response.success && response.data) {
        const transformedBannedUsers: BannedUser[] = response.data.map((item) => ({
          id: item.user.id,
          name: item.user.name,
          username: item.user.username,
          image: item.user.image,
        }))
        setBannedUsers(transformedBannedUsers)
        return
      }

      setBannedUsers([])
    } catch (err) {
      logError(err, { context: "Fetching banned users" })
      setBannedUsers([])
    } finally {
      setLoadingBannedUsers(false)
    }
  }, [username])

  const banUser = useCallback(
    async (userId: string) => {
      try {
        const response = await ForumService.banUser(username, userId)

        if (!response.success) {
          toast({
            title: "Error",
            description: response.message || "Failed to ban user",
            variant: "destructive",
          })
          return false
        }

        toast({
          title: "Success",
          description: "User has been banned from this forum",
        })
        await fetchBannedUsers()
        return true
      } catch (err) {
        logError(err, { context: "Banning user" })
        toast({
          title: "Error",
          description: "Failed to ban user",
          variant: "destructive",
        })
        return false
      }
    },
    [username, fetchBannedUsers]
  )

  const unbanUser = useCallback(
    async (userId: string) => {
      try {
        const response = await ForumService.unbanUser(username, userId)

        if (!response.success) {
          toast({
            title: "Error",
            description: response.message || "Failed to unban user",
            variant: "destructive",
          })
          return false
        }

        setBannedUsers((prev) => prev.filter((user) => user.id !== userId))
        toast({
          title: "Success",
          description: "User has been unbanned",
        })
        return true
      } catch (err) {
        logError(err, { context: "Unbanning user" })
        toast({
          title: "Error",
          description: "Failed to unban user",
          variant: "destructive",
        })
        return false
      }
    },
    [username]
  )

  const deletePost = useCallback(
    async (postId: string) => {
      try {
        const response = await ForumService.deletePost(username, postId)

        if (!response.success) {
          toast({
            title: "Error",
            description: response.message || "Failed to delete post",
            variant: "destructive",
          })
          return false
        }

        setPosts((prev) => prev.filter((p) => p.id !== postId))
        toast({
          title: "Success",
          description: "Post has been deleted",
        })
        return true
      } catch (err) {
        logError(err, { context: "Deleting post" })
        toast({
          title: "Error",
          description: "Failed to delete post",
          variant: "destructive",
        })
        return false
      }
    },
    [username]
  )

  const togglePin = useCallback(
    async (postId: string) => {
      const currentPost = posts.find((p) => p.id === postId)
      if (!currentPost) return false

      try {
        const newPinnedStatus = !currentPost.pinned
        const response = await ForumService.togglePin(username, postId, newPinnedStatus)

        if (!response.success || !response.data) {
          toast({
            title: "Error",
            description: response.message || "Failed to toggle pin status",
            variant: "destructive",
          })
          return false
        }

        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, pinned: response.data!.pinned } : p))
        )

        toast({
          title: "Success",
          description: response.data.pinned ? "Post pinned successfully" : "Post unpinned successfully",
        })
        return true
      } catch (err) {
        logError(err, { context: "Toggling pin" })
        toast({
          title: "Error",
          description: "Failed to toggle pin status",
          variant: "destructive",
        })
        return false
      }
    },
    [username, posts]
  )

  const savePost = useCallback(
    async (postId: string | undefined, title: string, content: string) => {
      if (postId) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, title, content } : p))
        )
        return
      }

      await fetchPosts()
    },
    [fetchPosts]
  )

  useEffect(() => {
    fetchPosts()
    fetchBannedUsers()
  }, [fetchPosts, fetchBannedUsers])

  return {
    posts,
    setPosts,
    bannedUsers,
    loading,
    loadingBannedUsers,
    fetchPosts,
    fetchBannedUsers,
    banUser,
    unbanUser,
    deletePost,
    togglePin,
    savePost,
  }
}

export default useForumPosts
