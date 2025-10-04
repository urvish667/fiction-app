import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/auth/db-adapter'
import { sanitizeForumPost } from '@/utils/sanitization'

type CommentParams = { params: Promise<{ username: string, id: string, commentId: string }> }

// PUT: Update a comment
export async function PUT(request: NextRequest, context: CommentParams) {
  try {
    const params = await context.params
    const { username, id: postId, commentId } = params

    // Get authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Parse request body
    const { content } = await request.json()

    // Validate input
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required and must be a string' }, { status: 400 })
    }

    const trimmedContent = content.trim()
    if (trimmedContent.length < 1) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 })
    }

    if (trimmedContent.length > 3000) {
      return NextResponse.json({ error: 'Content cannot exceed 3000 characters' }, { status: 400 })
    }

    // Get forum owner and comment with post
    const [forumOwner, comment] = await Promise.all([
      prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          preferences: true
        }
      }),
      prisma.forumPostComment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          postId: true,
          userId: true,
          deleted: true,
          post: {
            select: {
              forumId: true,
              forum: {
                select: { authorId: true }
              }
            }
          }
        }
      })
    ])

    if (!forumOwner) {
      return NextResponse.json({ error: 'Forum owner not found' }, { status: 404 })
    }

    if (!comment || comment.deleted) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.postId !== postId) {
      return NextResponse.json({ error: 'Comment does not belong to this post' }, { status: 400 })
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
      return NextResponse.json({ error: 'Forum is not enabled' }, { status: 403 })
    }

    // Only the comment author can edit their own comment
    if (comment.userId !== userId) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 })
    }

    // Sanitize content
    const sanitizedContent = sanitizeForumPost(trimmedContent)

    if (sanitizedContent.length < 1) {
      return NextResponse.json({ error: 'Content contains invalid content after sanitization' }, { status: 400 })
    }

    // Update the comment
    const updatedComment = await prisma.forumPostComment.update({
      where: { id: commentId },
      data: {
        content: sanitizedContent,
        editedAt: new Date()
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        editedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Comment updated successfully',
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        createdAt: updatedComment.createdAt,
        editedAt: updatedComment.editedAt,
        author: {
          id: updatedComment.user.id,
          name: updatedComment.user.name || updatedComment.user.username,
          username: updatedComment.user.username,
          image: updatedComment.user.image
        }
      }
    })

  } catch (error) {
    console.error('Error updating forum comment:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to update comment'
    }, { status: 500 })
  }
}

// DELETE: Delete a comment
export async function DELETE(request: NextRequest, context: CommentParams) {
  try {
    const params = await context.params
    const { username, id: postId, commentId } = params

    // Get authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get forum owner and comment with post
    const [forumOwner, comment] = await Promise.all([
      prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          preferences: true
        }
      }),
      prisma.forumPostComment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          postId: true,
          userId: true,
          deleted: true,
          post: {
            select: {
              forumId: true,
              forum: {
                select: { authorId: true }
              }
            }
          }
        }
      })
    ])

    if (!forumOwner) {
      return NextResponse.json({ error: 'Forum owner not found' }, { status: 404 })
    }

    if (!comment || comment.deleted) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.postId !== postId) {
      return NextResponse.json({ error: 'Comment does not belong to this post' }, { status: 400 })
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
      return NextResponse.json({ error: 'Forum is not enabled' }, { status: 403 })
    }

    // Only the comment author or forum owner can delete
    const isCommentAuthor = comment.userId === userId
    const isForumOwner = forumOwner.id === userId

    if (!isCommentAuthor && !isForumOwner) {
      return NextResponse.json({ error: 'You can only delete your own comments or you must be the forum owner' }, { status: 403 })
    }

    // Delete the comment (soft delete)
    await prisma.forumPostComment.update({
      where: { id: commentId },
      data: { deleted: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting forum comment:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to delete comment'
    }, { status: 500 })
  }
}
