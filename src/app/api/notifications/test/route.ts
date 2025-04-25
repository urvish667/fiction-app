import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createNotification, queueNotification } from '@/lib/notification-service';
import { z } from 'zod';

// Schema for validating request body
const testNotificationSchema = z.object({
  type: z.string(),
  title: z.string().optional(),
  message: z.string().optional(),
  content: z.record(z.any()).optional(),
  delay: z.number().optional(),
});

/**
 * POST endpoint to create a test notification
 * This is only available in development mode
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test endpoint not available in production' },
        { status: 403 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = testNotificationSchema.parse(body);

    const { type, delay = 0 } = validatedData;

    // Generate title and message based on type if not provided
    const title = validatedData.title || `Test ${type} Notification`;
    const message = validatedData.message || `This is a test ${type} notification`;

    // Create notification
    if (delay > 0) {
      queueNotification({
        userId: session.user.id,
        type,
        title,
        message,
        content: validatedData.content,
      }, delay);

      return NextResponse.json({
        message: `Test notification queued with ${delay}ms delay`,
      });
    } else {
      const notification = await createNotification({
        userId: session.user.id,
        type,
        title,
        message,
        content: validatedData.content,
      });

      return NextResponse.json({
        message: 'Test notification created',
        notification,
      });
    }
  } catch (error) {
    console.error('Error creating test notification:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}
