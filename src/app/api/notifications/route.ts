import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getNotifications } from "@/lib/notification-service";
import { logger } from "@/lib/logger";
import { withApiLogging } from "@/lib/monitoring/api-logger";

/**
 * GET endpoint to retrieve notifications for the current user
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Number of notifications per page (default: 20)
 * - type: Filter by notification type
 * - read: Filter by read status (true/false)
 */
export const GET = withApiLogging(async (request: NextRequest) => {
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

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Add upper limit for safety
    const type = searchParams.get("type") || undefined;
    const readStatus = searchParams.get("read");

    // Handle chapter type (temporarily disabled)
    if (type === "chapter") {
      // Return empty result for chapter notifications since they're disabled
      return NextResponse.json({
        notifications: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
        },
      });
    }

    // Get notifications using the service
    const result = await getNotifications(session.user.id, {
      page,
      limit,
      type,
      read: readStatus === "true" ? true : readStatus === "false" ? false : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching notifications:", {
      error,
      userId: session?.user?.id
    });

    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
});
