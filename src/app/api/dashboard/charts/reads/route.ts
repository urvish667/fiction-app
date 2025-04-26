import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReadsChartData } from "@/lib/services/dashboard-service";
import { ApiResponse, ReadsDataPoint } from "@/types/dashboard";
import { logger } from "@/lib/logger";

// Valid time range options
const VALID_TIME_RANGES = ['7days', '30days', '90days', 'year', 'all'];

// Create a dedicated logger for this endpoint
const readsChartLogger = logger.child('dashboard-reads-chart');

/**
 * GET /api/dashboard/charts/reads
 * Fetches reads chart data for the dashboard
 * @param timeRange - The time range for the chart data
 */
export async function GET(request: Request) {
  // Get the timeRange from the URL query parameters
  const url = new URL(request.url);
  const timeRange = url.searchParams.get('timeRange') || '30days';

  // Validate timeRange parameter
  if (!VALID_TIME_RANGES.includes(timeRange)) {
    readsChartLogger.warn(`Invalid time range parameter: ${timeRange}`);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid time range parameter",
      },
      { status: 400 }
    );
  }

  try {
    readsChartLogger.debug('Processing reads chart request', { timeRange });

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      readsChartLogger.warn('Unauthorized access attempt to reads chart data');
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "Unauthorized",
      }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;

    if (!userId) {
      readsChartLogger.warn('Missing user ID in session', { session });
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "User ID not found in session",
      }, { status: 400 });
    }

    // Log the request details
    readsChartLogger.info('Fetching reads chart data', { userId, timeRange });

    // Fetch reads chart data
    const chartData = await getReadsChartData(userId, timeRange);

    readsChartLogger.debug('Reads chart data retrieved successfully', { userId, dataPoints: chartData.length });

    // Set cache headers for better performance
    // Cache for 5 minutes on client, revalidate every hour on server
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');

    return NextResponse.json<ApiResponse<ReadsDataPoint[]>>(
      {
        success: true,
        data: chartData,
      },
      { headers }
    );
  } catch (error) {
    // Log the error with detailed context
    readsChartLogger.error('Error fetching reads chart data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timeRange
    });

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch reads chart data",
    }, { status: 500 });
  }
}
