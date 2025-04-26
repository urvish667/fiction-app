import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardOverviewData } from "@/lib/services/dashboard-service";
import { ApiResponse, DashboardOverviewData } from "@/types/dashboard";
import { logger } from "@/lib/logger";

// Create a dedicated logger for this endpoint
const overviewLogger = logger.child('dashboard-overview-api');

/**
 * GET /api/dashboard/overview
 * Fetches overview data for the dashboard
 * @param timeRange - The time range for the dashboard data (e.g., 7days, 30days, 90days, year, all)
 */
export async function GET(request: Request) {
  // Get the timeRange from the URL query parameters
  const url = new URL(request.url);
  const timeRange = url.searchParams.get('timeRange') || '30days';

  try {
    overviewLogger.debug('Processing dashboard overview request', { timeRange });

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      overviewLogger.warn('Unauthorized access attempt to dashboard overview');
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "Unauthorized",
      }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;

    if (!userId) {
      overviewLogger.warn('Missing user ID in session', { session });
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "User ID not found in session",
      }, { status: 400 });
    }

    // Log the request details
    overviewLogger.info('Fetching dashboard overview data', { userId, timeRange });

    // Fetch dashboard data with the specified time range
    const dashboardData = await getDashboardOverviewData(userId, timeRange);

    overviewLogger.debug('Dashboard overview data retrieved successfully', { userId });

    return NextResponse.json<ApiResponse<DashboardOverviewData>>({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    // Log the error with detailed context
    overviewLogger.error('Error fetching dashboard overview data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timeRange
    });

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch dashboard data",
    }, { status: 500 });
  }
}
