import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { UserPreferences, defaultPreferences } from '@/types/user'
import { Prisma } from '@prisma/client'

const preferencesSchema = z.object({
  emailNotifications: z.object({
    newFollower: z.boolean(),
    newComment: z.boolean(),
    newLike: z.boolean(),
    newChapter: z.boolean(),
  }),
  privacySettings: z.object({
    publicProfile: z.boolean(),
    showEmail: z.boolean(),
    showLocation: z.boolean(),
    allowMessages: z.boolean(),
  }),
})

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = preferencesSchema.parse(body)

    const updatedUser = await prisma.$executeRaw`
      UPDATE "User"
      SET preferences = ${JSON.stringify({
        ...defaultPreferences,
        ...validatedData,
      })}::jsonb
      WHERE id = ${session.user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid preferences data' },
        { status: 400 }
      )
    }

    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}