import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/auth/db-adapter'
import { ForumType } from '@prisma/client'

type BanParams = { params: { username: string, userId: string } }

// PUT: Ban a user from the forum (moderator only)
export async function PUT(request: NextRequest, { params }: BanParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username, userId } = await params

    // Find forum owner
    const forumOwner = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (!forumOwner) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if current user is the forum owner
    if (session.user.id !== forumOwner.id) {
      return NextResponse.json({ error: 'Only the forum owner can ban users' }, { status: 403 })
    }

    // Find forum
    const forum = await prisma.forum.findFirst({
      where: { authorId: forumOwner.id, type: ForumType.AUTHOR },
      select: { id: true }
    })

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 })
    }

    // Ban the user (using upsert to avoid duplicates)
    await prisma.forumBan.upsert({
      where: {
        forumId_userId: {
          forumId: forum.id,
          userId: userId
        }
      },
      update: {},
      create: {
        forumId: forum.id,
        userId: userId
      }
    })

    return NextResponse.json({ message: 'User banned successfully' })
  } catch (error) {
    console.error('Error banning user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Unban a user from the forum (moderator only)
export async function DELETE(request: NextRequest, { params }: BanParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username, userId } = params

    // Find forum owner
    const forumOwner = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (!forumOwner) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if current user is the forum owner
    if (session.user.id !== forumOwner.id) {
      return NextResponse.json({ error: 'Only the forum owner can unban users' }, { status: 403 })
    }

    // Find forum
    const forum = await prisma.forum.findFirst({
      where: { authorId: forumOwner.id, type: ForumType.AUTHOR },
      select: { id: true }
    })

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 })
    }

    // Unban the user
    await prisma.forumBan.deleteMany({
      where: {
        forumId: forum.id,
        userId: userId
      }
    })

    return NextResponse.json({ message: 'User unbanned successfully' })
  } catch (error) {
    console.error('Error unbanning user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
