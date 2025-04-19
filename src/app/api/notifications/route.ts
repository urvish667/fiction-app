import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNotifications } from "@/lib/notification-service";

/**
 * GET endpoint to retrieve notifications for the current user
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Number of notifications per page (default: 20)
 * - type: Filter by notification type
 * - read: Filter by read status (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const readStatus = searchParams.get("read");

    // Get notifications using the service
    const result = await getNotifications(session.user.id, {
      page,
      limit,
      type,
      read: readStatus === "true" ? true : readStatus === "false" ? false : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
