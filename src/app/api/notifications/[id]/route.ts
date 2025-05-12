import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deleteNotification } from "@/lib/notification-service";
import { logger } from "@/lib/logger";
import { withApiLogging } from "@/lib/monitoring/api-logger";

/**
 * DELETE endpoint to delete a notification
 */
// Define the handler function that will be wrapped
async function deleteNotificationHandler(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  let session;
  try {
    const resolvedParams = await params;
    const notificationId = resolvedParams.id;

    // Check authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the notification to verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Check if the notification belongs to the user
    if (notification.userId !== session.user.id) {
      logger.warn("Unauthorized notification deletion attempt", {
        userId: session.user.id,
        notificationId,
        notificationOwnerId: notification.userId
      });

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete the notification using the service
    await deleteNotification(session.user.id, notificationId);

    return NextResponse.json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting notification:", {
      error,
      userId: session?.user?.id,
      params
    });

    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}

// Export the DELETE handler with API logging
export const DELETE = withApiLogging((request: NextRequest) => {
  // Extract params from the URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  // Call the handler with the request and params
  return deleteNotificationHandler(request, { params: { id } });
});
