import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/auth/db-adapter'
import { ForumType } from '@prisma/client'
import { createSlug } from '@/utils/slug'
import { sanitizeForumPost } from '@/utils/sanitization'
import { randomBytes } from 'crypto'
import { nanoid } from 'nanoid'

type CreatePostParams = { params: Promise<{ username: string }> }

// Generate a safe, URL-friendly ID with random component
function generateSafeId(): string {
  // Use nanoid for safe, URL-friendly base and add random bytes for extra entropy
  const randomComponent = randomBytes(4).toString('hex')
  const safeComponent = nanoid(8)
  return `${safeComponent}-${randomComponent}`
}

// POST: Create a new forum post
export async function POST(request: NextRequest, context: CreatePostParams) {
  try {
    const params = await context.params
    const { username } = params

    // Get authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

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

    // Check if user exists and get forum owner
    const [currentUser, forumOwner] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true }
      }),
      prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          preferences: true
        }
      })
    ])

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!forumOwner) {
      return NextResponse.json({ error: 'Forum owner not found' }, { status: 404 })
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

    // Find or create the forum for this author
    let forum = await prisma.forum.findFirst({
      where: { authorId: forumOwner.id, type: ForumType.AUTHOR },
      select: { id: true }
    })

    if (!forum) {
      // Create the forum if it doesn't exist
      const forumUsername = forumOwner.username || 'unknown'
      forum = await prisma.forum.create({
        data: {
          authorId: forumOwner.id,
          type: ForumType.AUTHOR,
          name: `${forumUsername}'s Forum`,
          slug: forumUsername
        },
        select: { id: true }
      })
    }

    // Check if user is banned
    const ban = await prisma.forumBan.findFirst({
      where: {
        forumId: forum.id,
        userId: currentUser.id
      }
    })

    if (ban) {
      return NextResponse.json({ error: 'You are banned from this forum' }, { status: 403 })
    }

    // Sanitize and validate content
    const sanitizedTitle = sanitizeForumPost(title.trim()).substring(0, 250) // Max 250 chars for title
    const sanitizedContent = sanitizeForumPost(content.trim())

    if (sanitizedTitle.length < 3) {
      return NextResponse.json({ error: 'Title contains invalid content' }, { status: 400 })
    }

    if (sanitizedContent.length < 10) {
      return NextResponse.json({ error: 'Content contains invalid content' }, { status: 400 })
    }

    // Generate slug and ensure uniqueness
    let baseSlug = createSlug(sanitizedTitle)
    let slug = baseSlug
    let counter = 1

    // Check for slug uniqueness within this forum
    while (await prisma.forumPost.findFirst({
      where: {
        forumId: forum.id,
        slug: slug
      }
    })) {
      slug = `${baseSlug}-${counter}`
      counter++
      if (counter > 1000) {
        // Add random component if we can't find a unique slug
        slug = `${baseSlug}-${generateSafeId()}`
        break
      }
    }

    // Create the post with transaction for safety
    const post = await prisma.$transaction(async (tx) => {
      const postId = generateSafeId()

      return await tx.forumPost.create({
        data: {
          id: postId,
          forumId: forum.id,
          authorId: currentUser.id,
          title: sanitizedTitle,
          slug: slug,
          content: sanitizedContent
        },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          createdAt: true,
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
    })

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        createdAt: post.createdAt,
        author: {
          id: post.author.id,
          name: post.author.name || post.author.username,
          username: post.author.username,
          image: post.author.image
        }
      }
    })

  } catch (error) {
    console.error('Error creating forum post:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to create post'
    }, { status: 500 })
  }
}

// GET: Fetch forum posts with pagination
export async function GET(request: NextRequest, context: CreatePostParams) {
  try {
    const params = await context.params
    const { username } = params

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 per page
    const skip = (page - 1) * limit

    // Find forum owner
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

    // Find forum - don't create it for GET requests since there might be no posts yet
    const forum = await prisma.forum.findFirst({
      where: { authorId: forumOwner.id, type: ForumType.AUTHOR },
      select: { id: true }
    })

    if (!forum) {
      // Return empty posts array if forum doesn't exist yet
      return NextResponse.json({
        success: true,
        posts: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      })
    }

    // Get posts with comment count
    const [posts, totalCount] = await Promise.all([
      prisma.forumPost.findMany({
        where: {
          forumId: forum.id,
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
        },
        orderBy: [
          // Pinned posts first, then by pin order, then by creation date
          { pinned: 'desc' },
          { pinnedOrder: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.forumPost.count({
        where: {
          forumId: forum.id,
          deleted: false
        }
      })
    ])

    // Transform posts to match expected format
    const transformedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      pinned: post.pinned,
      createdAt: post.createdAt,
      commentCount: post._count.comments,
      comments: [], // For list view, we don't load all comments initially
      author: {
        id: post.author.id,
        name: post.author.name || post.author.username,
        username: post.author.username,
        image: post.author.image
      }
    }))

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching forum posts:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch posts'
    }, { status: 500 })
  }
}
