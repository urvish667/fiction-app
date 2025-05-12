import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getEarningsChartData } from "@/lib/services/dashboard-service";
import { ApiResponse, EarningsDataPoint } from "@/types/dashboard";
import { logger } from "@/lib/logger";

// Valid time range options
const VALID_TIME_RANGES = ['7days', '30days', '90days', 'year', 'all'];

// Create a dedicated logger for this endpoint
const earningsChartLogger = logger.child('dashboard-earnings-chart');

/**
 * GET /api/dashboard/charts/earnings
 * Fetches earnings chart data for the dashboard
 * @param timeRange - The time range for the chart data
 */
export async function GET(request: Request) {
  // Get the timeRange from the URL query parameters
  const url = new URL(request.url);
  const timeRange = url.searchParams.get('timeRange') || '30days';

  // Validate timeRange parameter
  if (!VALID_TIME_RANGES.includes(timeRange)) {
    earningsChartLogger.warn(`Invalid time range parameter: ${timeRange}`);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid time range parameter",
      },
      { status: 400 }
    );
  }

  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      earningsChartLogger.info('Unauthorized access attempt to earnings chart data');
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = session.user.id;

    if (!userId) {
      earningsChartLogger.warn(`User ID not found in session for user: ${session.user.email || 'unknown'}`);
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "User ID not found in session",
        },
        { status: 400 }
      );
    }

    // Fetch earnings chart data
    const chartData = await getEarningsChartData(userId, timeRange);

    // Set cache headers for better performance
    // Cache for 5 minutes on client, revalidate every hour on server
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');

    return NextResponse.json<ApiResponse<EarningsDataPoint[]>>(
      {
        success: true,
        data: chartData,
      },
      { headers }
    );
  } catch (error) {
    // Log the error with additional context if available
    earningsChartLogger.error(`Error fetching earnings chart data: ${error instanceof Error ? error.message : String(error)}`);

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to fetch earnings chart data",
      },
      { status: 500 }
    );
  }
}
