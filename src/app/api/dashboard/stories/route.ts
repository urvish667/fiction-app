import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getTopStories } from "@/lib/services/dashboard-service";
import { ApiResponse, DashboardStory } from "@/types/dashboard";
import { logger } from "@/lib/logger";

// Valid time range options
const VALID_TIME_RANGES = ['7days', '30days', '90days', 'year', 'all'];
// Valid sort options
const VALID_SORT_OPTIONS = ['reads', 'likes', 'comments', 'earnings'];

// Create a dedicated logger for this endpoint
const storiesLogger = logger.child('dashboard-stories-api');

/**
 * GET /api/dashboard/stories
 * Fetches top performing stories for the dashboard
 */
export async function GET(request: Request) {
  // Get query parameters
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '5');
  const sortBy = url.searchParams.get('sortBy') || 'reads';
  const timeRange = url.searchParams.get('timeRange') || '30days';

  // Validate timeRange parameter
  if (!VALID_TIME_RANGES.includes(timeRange)) {
    storiesLogger.warn(`Invalid time range parameter: ${timeRange}`);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid time range parameter",
      },
      { status: 400 }
    );
  }

  // Validate sortBy parameter
  if (!VALID_SORT_OPTIONS.includes(sortBy)) {
    storiesLogger.warn(`Invalid sort parameter: ${sortBy}`);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid sort parameter",
      },
      { status: 400 }
    );
  }

  try {
    storiesLogger.debug('Processing dashboard stories request', { limit, sortBy, timeRange });

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      storiesLogger.warn('Unauthorized access attempt to dashboard stories');
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "Unauthorized",
      }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;

    if (!userId) {
      storiesLogger.warn('Missing user ID in session', { session });
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "User ID not found in session",
      }, { status: 400 });
    }

    // Log the request details
    storiesLogger.info('Fetching dashboard stories', { userId, limit, sortBy, timeRange });

    // Fetch top stories
    const stories = await getTopStories(userId, limit, sortBy, timeRange);

    storiesLogger.debug('Dashboard stories retrieved successfully', { userId, count: stories.length });

    // Set cache headers for better performance
    // Cache for 5 minutes on client, revalidate every hour on server
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');

    return NextResponse.json<ApiResponse<DashboardStory[]>>(
      {
        success: true,
        data: stories,
      },
      { headers }
    );
  } catch (error) {
    // Log the error with detailed context
    storiesLogger.error('Error fetching dashboard stories', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      limit,
      sortBy,
      timeRange
    });

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch top stories",
    }, { status: 500 });
  }
}
