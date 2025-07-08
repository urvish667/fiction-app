import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getEarningsData } from "@/lib/services/dashboard-service";
import { ApiResponse, EarningsData } from "@/types/dashboard";
import { logger } from "@/lib/logger";

// Valid time range options
const VALID_TIME_RANGES = ['7days', '30days', '90days', 'year', 'all'];

// Create a dedicated logger for this endpoint
const earningsLogger = logger.child('dashboard-earnings-api');

/**
 * GET /api/dashboard/earnings
 * Fetches earnings data for the dashboard
 * @param timeRange - The time range for the earnings data
 */
export async function GET(request: Request) {
  // Get the parameters from the URL query parameters
  const url = new URL(request.url);
  const timeRange = url.searchParams.get('timeRange') || '30days';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);

  // Validate timeRange parameter
  if (!VALID_TIME_RANGES.includes(timeRange)) {
    earningsLogger.warn(`Invalid time range parameter: ${timeRange}`);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid time range parameter",
      },
      { status: 400 }
    );
  }

  // Validate pagination parameters
  if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1 || pageSize > 50) {
    earningsLogger.warn(`Invalid pagination parameters: page=${page}, pageSize=${pageSize}`);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid pagination parameters",
      },
      { status: 400 }
    );
  }

  try {
    earningsLogger.debug('Processing earnings data request', { timeRange });

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      earningsLogger.warn('Unauthorized access attempt to earnings data');
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "Unauthorized",
      }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;

    if (!userId) {
      earningsLogger.warn('Missing user ID in session', { session });
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "User ID not found in session",
      }, { status: 400 });
    }

    // Log the request details
    earningsLogger.info('Fetching earnings data', { userId, timeRange, page, pageSize });

    // Fetch earnings data
    const earningsData = await getEarningsData(userId, timeRange, page, pageSize);

    // We no longer need to fetch donations separately as they're included in earningsData.transactions

    earningsLogger.debug('Earnings data retrieved successfully', { userId });

    // Set cache headers for better performance
    // Cache for 5 minutes on client, revalidate every hour on server
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');

    return NextResponse.json<ApiResponse<EarningsData>>(
      {
        success: true,
        data: earningsData,
      },
      { headers }
    );
  } catch (error) {
    // Log the error with detailed context
    earningsLogger.error('Error fetching earnings data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timeRange
    });

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch earnings data",
    }, { status: 500 });
  }
}
