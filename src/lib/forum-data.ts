import { prisma } from '@/lib/auth/db-adapter'
import { ForumType } from '@prisma/client'

export async function getForumPostData(username: string, slug: string) {
  try {
    // Find forum owner
    const forumOwner = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        preferences: true
      }
    })

    if (!forumOwner) {
      return null
    }

    // Check if forum is enabled
    let preferences = {
      privacySettings: {
        forum: false
      }
    }

    if (forumOwner.preferences) {
      try {
        preferences = typeof forumOwner.preferences === 'string'
          ? JSON.parse(forumOwner.preferences)
          : forumOwner.preferences
      } catch (error) {
        // Fall back to default
      }
    }

    if (!preferences.privacySettings?.forum) {
      return null
    }

    // Find forum
    const forum = await prisma.forum.findFirst({
      where: { authorId: forumOwner.id, type: ForumType.AUTHOR },
      select: { id: true }
    })

    if (!forum) {
      return null
    }

    // Get post by slug with comments and counts
    const post = await prisma.forumPost.findFirst({
      where: {
        forumId: forum.id,
        slug: slug,
        deleted: false
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        pinned: true,
        pinnedOrder: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        _count: {
          select: {
            comments: {
              where: { deleted: false }
            }
          }
        }
      }
    })

    if (!post) {
      return null
    }

    // Get comments separately
    const comments = await prisma.forumPostComment.findMany({
      where: {
        postId: post.id,
        deleted: false
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Transform post to match expected format
    const transformedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      pinned: post.pinned,
      createdAt: post.createdAt,
      commentCount: post._count.comments,
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: comment.user.id,
          name: comment.user.name || comment.user.username || 'Unknown',
          username: comment.user.username || 'unknown',
          image: comment.user.image
        }
      })),
      author: {
        id: post.author.id,
        name: post.author.name || post.author.username || 'Unknown',
        username: post.author.username || 'unknown',
        image: post.author.image
      }
    }

    return {
      post: transformedPost,
      user: {
        id: forumOwner.id,
        name: forumOwner.name || forumOwner.username || 'Unknown',
        username: forumOwner.username || 'unknown',
        image: forumOwner.image
      }
    }
  } catch (error) {
    console.error('Error fetching post data:', error)
    return null
  }
}
