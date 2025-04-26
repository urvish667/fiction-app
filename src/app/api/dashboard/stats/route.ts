import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/dashboard-service";
import { ApiResponse, DashboardStats } from "@/types/dashboard";
import { logger } from "@/lib/logger";

// Create a dedicated logger for this endpoint
const statsLogger = logger.child('dashboard-stats-api');

/**
 * GET /api/dashboard/stats
 * Fetches dashboard statistics
 * @param timeRange - The time range for the dashboard data (e.g., 7days, 30days, 90days, year, all)
 */
export async function GET(request: Request) {
  // Get the timeRange from the URL query parameters
  const url = new URL(request.url);
  const timeRange = url.searchParams.get('timeRange') || '30days';

  try {
    statsLogger.debug('Processing dashboard stats request', { timeRange });

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      statsLogger.warn('Unauthorized access attempt to dashboard stats');
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "Unauthorized",
      }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;

    if (!userId) {
      statsLogger.warn('Missing user ID in session', { session });
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "User ID not found in session",
      }, { status: 400 });
    }

    // Log the request details
    statsLogger.info('Fetching dashboard stats', { userId, timeRange });

    // Fetch dashboard stats
    const stats = await getDashboardStats(userId, timeRange);

    statsLogger.debug('Dashboard stats retrieved successfully', { userId });

    return NextResponse.json<ApiResponse<DashboardStats>>({
      success: true,
      data: stats,
    });
  } catch (error) {
    // Log the error with detailed context
    statsLogger.error('Error fetching dashboard stats', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timeRange
    });

    // Return a standardized error response
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch dashboard stats",
    }, { status: 500 });
  }
}
