import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/auth/db-adapter'
import { ForumType } from '@prisma/client'
import { sanitizeForumPost } from '@/utils/sanitization'

type CommentsParams = { params: Promise<{ username: string, id: string }> }

// POST: Create a new comment on a forum post
export async function POST(request: NextRequest, context: CommentsParams) {
  try {
    const params = await context.params
    const { username, id: postId } = params

    // Get authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Parse request body
    const { content, parentId } = await request.json()

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

    // Verify user exists
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get forum owner and post
    const [forumOwner, post] = await Promise.all([
      prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          preferences: true
        }
      }),
      prisma.forumPost.findUnique({
        where: { id: postId, deleted: false },
        select: {
          id: true,
          forumId: true,
          forum: {
            select: { authorId: true }
          }
        }
      })
    ])

    if (!forumOwner) {
      return NextResponse.json({ error: 'Forum owner not found' }, { status: 404 })
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
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

    // Check if user is banned
    const ban = await prisma.forumBan.findFirst({
      where: {
        forumId: post.forumId,
        userId: currentUser.id
      }
    })

    if (ban) {
      return NextResponse.json({ error: 'You are banned from this forum' }, { status: 403 })
    }

    // Validate parent comment if provided
    if (parentId) {
      const parentComment = await prisma.forumPostComment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true, deleted: true }
      })

      if (!parentComment || parentComment.deleted) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }

      if (parentComment.postId !== postId) {
        return NextResponse.json({ error: 'Parent comment does not belong to this post' }, { status: 400 })
      }
    }

    // Sanitize content
    const sanitizedContent = sanitizeForumPost(trimmedContent)

    if (sanitizedContent.length < 1) {
      return NextResponse.json({ error: 'Content contains invalid content after sanitization' }, { status: 400 })
    }

    // Create the comment
    const comment = await prisma.forumPostComment.create({
      data: {
        postId: postId,
        userId: currentUser.id,
        content: sanitizedContent,
        ...(parentId && { parentId })
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        parentId: true,
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
      message: 'Comment created successfully',
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        parentId: comment.parentId,
        author: {
          id: comment.user.id,
          name: comment.user.name || comment.user.username,
          username: comment.user.username,
          image: comment.user.image
        }
      }
    })

  } catch (error) {
    console.error('Error creating forum comment:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to create comment'
    }, { status: 500 })
  }
}

// GET: Fetch comments for a forum post with pagination
export async function GET(request: NextRequest, context: CommentsParams) {
  try {
    const params = await context.params
    const { username, id: postId } = params

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 per page
    const skip = (page - 1) * limit

    // Get forum owner
    const forumOwner = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        preferences: true
      }
    })

    if (!forumOwner) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

    // Verify post exists and belongs to this forum
    const post = await prisma.forumPost.findUnique({
      where: { id: postId, deleted: false },
      select: {
        id: true,
        forumId: true,
        forum: {
          select: { authorId: true }
        }
      }
    })

    if (!post || post.forum.authorId !== forumOwner.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get comments with count
    const [comments, totalCount] = await Promise.all([
      prisma.forumPostComment.findMany({
        where: {
          postId: postId,
          deleted: false
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          parentId: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          },
          _count: {
            select: {
              replies: {
                where: { deleted: false }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.forumPostComment.count({
        where: {
          postId: postId,
          deleted: false
        }
      })
    ])

    // Transform comments to match expected format
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      parentId: comment.parentId,
      replyCount: comment._count.replies,
      author: {
        id: comment.user.id,
        name: comment.user.name || comment.user.username,
        username: comment.user.username,
        image: comment.user.image
      }
    }))

    return NextResponse.json({
      success: true,
      comments: transformedComments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching forum comments:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch comments'
    }, { status: 500 })
  }
}
