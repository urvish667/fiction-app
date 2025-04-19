import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markNotificationsAsRead } from "@/lib/notification-service";
import { z } from "zod";

// Schema for validating request body
const markReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

/**
 * PUT endpoint to mark notifications as read
 *
 * Request body:
 * - ids: Array of notification IDs to mark as read
 * - all: Boolean to mark all notifications as read
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = markReadSchema.parse(body);

    // Mark specific notifications as read
    if (validatedData.ids && validatedData.ids.length > 0) {
      await markNotificationsAsRead(session.user.id, validatedData.ids);

      return NextResponse.json({
        message: `${validatedData.ids.length} notifications marked as read`,
      });
    }

    // Mark all notifications as read
    if (validatedData.all) {
      await markNotificationsAsRead(session.user.id);

      return NextResponse.json({
        message: "All notifications marked as read",
      });
    }

    return NextResponse.json(
      { error: "No notifications specified to mark as read" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error marking notifications as read:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
