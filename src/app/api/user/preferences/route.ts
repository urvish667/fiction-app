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

// GET endpoint to retrieve user preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id;

    // Fetch from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse preferences from JSON if it exists
    let preferences = defaultPreferences;
    if (user.preferences) {
      try {
        const prefsData = typeof user.preferences === 'string'
          ? JSON.parse(user.preferences)
          : user.preferences;

        preferences = {
          ...defaultPreferences,
          ...prefsData
        };
      } catch (error) {
        console.error('Error parsing preferences:', error);
      }
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update user preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id;
    const body = await request.json()
    const validatedData = preferencesSchema.parse(body)

    // Combine with defaults
    const newPreferences = {
      ...defaultPreferences,
      ...validatedData,
    };

    // Update database
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: newPreferences,
        updatedAt: new Date() // Update the timestamp
      }
    });

    return NextResponse.json({ success: true, preferences: newPreferences })
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