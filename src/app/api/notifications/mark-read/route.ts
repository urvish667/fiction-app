import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markNotificationsAsRead } from "@/lib/notification-service";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { withApiLogging } from "@/lib/monitoring/api-logger";

// Schema for validating request body
const markReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
}).refine(data => data.ids !== undefined || data.all !== undefined, {
  message: "Either 'ids' or 'all' must be provided"
});

/**
 * PUT endpoint to mark notifications as read
 *
 * Request body:
 * - ids: Array of notification IDs to mark as read
 * - all: Boolean to mark all notifications as read
 */
export const PUT = withApiLogging(async (request: NextRequest) => {
  let session;
  try {
    // Check authentication
    session = await getServerSession(authOptions);
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
      // Limit the number of IDs that can be processed at once
      const maxIds = 100;
      const idsToProcess = validatedData.ids.slice(0, maxIds);

      if (validatedData.ids.length > maxIds) {
        logger.warn(`User ${session.user.id} attempted to mark ${validatedData.ids.length} notifications as read, limited to ${maxIds}`);
      }

      await markNotificationsAsRead(session.user.id, idsToProcess);

      return NextResponse.json({
        message: `${idsToProcess.length} notifications marked as read`,
      });
    }

    // Mark all notifications as read
    if (validatedData.all) {
      await markNotificationsAsRead(session.user.id);

      return NextResponse.json({
        message: "All notifications marked as read",
      });
    }

    // This should never happen due to the schema refinement
    return NextResponse.json(
      { error: "No notifications specified to mark as read" },
      { status: 400 }
    );
  } catch (error) {
    logger.error("Error marking notifications as read:", {
      error,
      userId: session?.user?.id
    });

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
});
