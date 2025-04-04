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

// Simple in-memory cache for preferences
const preferencesCache = new Map<string, { data: UserPreferences, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GET endpoint to retrieve user preferences with caching
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
    const now = Date.now();

    // Check cache first
    const cachedPrefs = preferencesCache.get(userId);
    if (cachedPrefs && (now - cachedPrefs.timestamp < CACHE_TTL)) {
      // Return cached preferences if still valid
      return NextResponse.json({ preferences: cachedPrefs.data });
    }

    // Cache miss or expired, fetch from database
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

        // Update cache
        preferencesCache.set(userId, { data: preferences, timestamp: now });
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

// PUT endpoint to update user preferences with cache invalidation
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

    // Update database using Prisma's update method instead of raw SQL
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: newPreferences,
        updatedAt: new Date() // Update the timestamp
      }
    });

    // Update cache
    preferencesCache.set(userId, {
      data: newPreferences,
      timestamp: Date.now()
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