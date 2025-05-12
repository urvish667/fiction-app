import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getUserStories } from "@/lib/services/dashboard-service";
import { ApiResponse } from "@/types/dashboard";
import { logger } from "@/lib/logger";

// Create a dedicated logger for this endpoint
const userStoriesLogger = logger.child('dashboard-user-stories-api');

/**
 * GET /api/dashboard/user-stories
 * Fetches all stories for the current user
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      userStoriesLogger.warn('Unauthorized access attempt');
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "Unauthorized",
      }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;

    if (!userId) {
      userStoriesLogger.warn('User ID not found in session');
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "User ID not found in session",
      }, { status: 400 });
    }

    userStoriesLogger.info('Fetching user stories', { userId });

    // Fetch user stories
    const stories = await getUserStories(userId);

    userStoriesLogger.debug('User stories retrieved successfully', { userId, count: stories.length });

    // Set cache headers for better performance
    // Cache for 5 minutes on client, revalidate every hour on server
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');

    // Type assertion to handle null values in optional fields
    return NextResponse.json({
      success: true,
      data: stories,
    } as ApiResponse<any>, { headers });
  } catch (error) {
    userStoriesLogger.error('Error fetching user stories', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch user stories",
    }, { status: 500 });
  }
}
