import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/auth/db-adapter'
import { ForumType } from '@prisma/client'

type OperationPostParams = { params: Promise<{ username: string, id: string }> }

// PATCH: Toggle pin status of a forum post (forum owner only)
export async function PATCH(request: NextRequest, context: OperationPostParams) {
  try {
    const params = await context.params
    const { username, id: postId } = params

    // Get authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id

    // Parse request body
    const { action } = await request.json()

    // Validate action
    if (action !== 'pin' && action !== 'unpin' && action !== 'toggle') {
      return NextResponse.json({ error: 'Invalid action. Must be pin, unpin, or toggle' }, { status: 400 })
    }

    // Get forum owner and post
    const [forumOwner, post] = await Promise.all([
      prisma.user.findUnique({
        where: { username },
        select: { id: true }
      }),
      prisma.forumPost.findUnique({
        where: { id: postId },
        select: {
          id: true,
          forumId: true,
          pinned: true,
          forum: {
            select: {
              id: true,
              authorId: true
            }
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

    // Check if current user is the forum owner
    const isForumOwner = currentUserId === post.forum.authorId

    if (!isForumOwner) {
      return NextResponse.json({ error: 'Only forum owners can pin/unpin posts' }, { status: 403 })
    }

    let newPinnedStatus: boolean

    if (action === 'toggle') {
      newPinnedStatus = !post.pinned
    } else {
      newPinnedStatus = action === 'pin'
    }

    // Use transaction to handle pin/unpin atomically
    await prisma.$transaction(async (tx) => {
      if (newPinnedStatus) {
        // If pinning this post, unpin all other posts in the forum first
        await tx.forumPost.updateMany({
          where: {
            forumId: post.forumId,
            pinned: true,
            id: { not: postId } // Don't unpin the post we're about to pin
          },
          data: {
            pinned: false,
            pinnedOrder: null,
            pinnedAt: null
          }
        })

        // Pin the target post
        await tx.forumPost.update({
          where: { id: postId },
          data: {
            pinned: true,
            pinnedAt: new Date(),
            pinnedOrder: 1 // Use 1 for highest priority since only one pinned
          }
        })
      } else {
        // Unpin the post
        await tx.forumPost.update({
          where: { id: postId },
          data: {
            pinned: false,
            pinnedOrder: null,
            pinnedAt: null
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: newPinnedStatus ? 'Post pinned successfully' : 'Post unpinned successfully',
      pinned: newPinnedStatus
    })

  } catch (error) {
    console.error('Error toggling post pin status:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to toggle pin status'
    }, { status: 500 })
  }
}

// DELETE: Delete a forum post (post author or forum owner)
export async function DELETE(request: NextRequest, context: OperationPostParams) {
  try {
    const params = await context.params
    const { username, id: postId } = params

    // Get authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id

    // Get forum owner and post
    const [forumOwner, post] = await Promise.all([
      prisma.user.findUnique({
        where: { username },
        select: { id: true }
      }),
      prisma.forumPost.findUnique({
        where: { id: postId },
        select: {
          id: true,
          authorId: true,
          forumId: true,
          forum: {
            select: {
              authorId: true
            }
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

    // Check if current user is the post author or forum owner
    const isPostAuthor = currentUserId === post.authorId
    const isForumOwner = currentUserId === post.forum.authorId

    if (!isPostAuthor && !isForumOwner) {
      return NextResponse.json({ error: 'You can only delete your own posts or posts in forums you own' }, { status: 403 })
    }

    // Delete the post
    await prisma.forumPost.update({
      where: { id: postId },
      data: { deleted: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting forum post:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to delete post'
    }, { status: 500 })
  }
}

// GET: Fetch a single forum post by slug or id
export async function GET(request: NextRequest, context: OperationPostParams) {
  try {
    const params = await context.params
    const { username, id: identifier } = params

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

    // Find forum
    const forum = await prisma.forum.findFirst({
      where: { authorId: forumOwner.id, type: ForumType.AUTHOR },
      select: { id: true }
    })

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 })
    }

    // Determine if identifier is numeric (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier)

    // Get post by id or slug with comments and counts
    const post = await prisma.forumPost.findFirst({
      where: {
        forumId: forum.id,
        ...(isNumeric ? { id: identifier } : { slug: identifier }),
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
            comments: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
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
      comments: comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: comment.user.id,
          name: comment.user.name || comment.user.username,
          username: comment.user.username,
          image: comment.user.image
        }
      })),
      author: {
        id: post.author.id,
        name: post.author.name || post.author.username,
        username: post.author.username,
        image: post.author.image
      }
    }

    return NextResponse.json({
      success: true,
      post: transformedPost,
      forumOwner: {
        id: forumOwner.id,
        name: forumOwner.name || forumOwner.username,
        username: forumOwner.username,
        image: forumOwner.image
      }
    })

  } catch (error) {
    console.error('Error fetching forum post:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch post'
    }, { status: 500 })
  }
}

// PUT: Update a forum post (post author only)
export async function PUT(request: NextRequest, context: OperationPostParams) {
  try {
    const params = await context.params
    const { username, id: postId } = params

    // Get authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id

    // Parse request body
    const { title, content } = await request.json()

    // Validate input
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    if (title.trim().length < 3) {
      return NextResponse.json({ error: 'Title must be at least 3 characters long' }, { status: 400 })
    }

    if (content.trim().length < 10) {
      return NextResponse.json({ error: 'Content must be at least 10 characters long' }, { status: 400 })
    }

    // Get forum owner and post
    const [forumOwner, post] = await Promise.all([
      prisma.user.findUnique({
        where: { username },
        select: { id: true }
      }),
      prisma.forumPost.findUnique({
        where: { id: postId },
        select: {
          id: true,
          authorId: true,
          forumId: true
        }
      })
    ])

    if (!forumOwner) {
      return NextResponse.json({ error: 'Forum owner not found' }, { status: 404 })
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if current user is the post author
    if (currentUserId !== post.authorId) {
      return NextResponse.json({ error: 'You can only edit your own posts' }, { status: 403 })
    }

    const sanitizedTitle = title.trim().substring(0, 250) // Max 250 chars for title
    const sanitizedContent = content.trim()

    if (sanitizedTitle.length < 3) {
      return NextResponse.json({ error: 'Title contains invalid content' }, { status: 400 })
    }

    if (sanitizedContent.length < 10) {
      return NextResponse.json({ error: 'Content contains invalid content' }, { status: 400 })
    }

    // Update the post
    const updatedPost = await prisma.forumPost.update({
      where: { id: postId },
      data: {
        title: sanitizedTitle,
        content: sanitizedContent,
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
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
      message: 'Post updated successfully',
      post: {
        id: updatedPost.id,
        title: updatedPost.title,
        slug: updatedPost.slug,
        content: updatedPost.content,
        createdAt: updatedPost.createdAt,
        updatedAt: updatedPost.updatedAt,
        author: {
          id: updatedPost.author.id,
          name: updatedPost.author.name || updatedPost.author.username,
          username: updatedPost.author.username,
          image: updatedPost.author.image
        }
      }
    })

  } catch (error) {
    console.error('Error updating forum post:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to update post'
    }, { status: 500 })
  }
}
