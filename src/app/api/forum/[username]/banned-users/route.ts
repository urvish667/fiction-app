import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/auth/db-adapter'
import { ForumType } from '@prisma/client'

type BannedUsersParams = { params: Promise<{ username: string }> }

// GET: Fetch banned users for a specific forum
export async function GET(request: NextRequest, context: BannedUsersParams) {
  try {
    const params = await context.params
    const { username } = params

    // Get authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id

    // Check if user exists and get forum owner
    const [currentUser, forumOwner] = await Promise.all([
      prisma.user.findUnique({
        where: { id: currentUserId },
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

    // Check if current user is the forum owner
    if (currentUserId !== forumOwner.id) {
      return NextResponse.json({ error: 'Only the forum owner can view banned users' }, { status: 403 })
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
      return NextResponse.json({
        success: true,
        bannedUsers: []
      })
    }

    // Get banned users with their details
    const bannedRecords = await prisma.forumBan.findMany({
      where: {
        forumId: forum.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform banned users data
    const bannedUsers = bannedRecords.map(record => ({
      id: record.user.id,
      name: record.user.name || record.user.username,
      username: record.user.username,
      image: record.user.image,
      bannedAt: record.createdAt,
      reason: record.reason
    }))

    return NextResponse.json({
      success: true,
      bannedUsers
    })

  } catch (error) {
    console.error('Error fetching banned users:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch banned users'
    }, { status: 500 })
  }
}
