import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTopStories } from "@/lib/services/dashboard-service";
import { ApiResponse, DashboardStory } from "@/types/dashboard";

/**
 * GET /api/dashboard/stories
 * Fetches top performing stories for the dashboard
 */
export async function GET(request: Request) {
  // Get query parameters
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '5');
  const sortBy = url.searchParams.get('sortBy') || 'reads';

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "Unauthorized",
      }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;
    
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "User ID not found in session",
      }, { status: 400 });
    }

    // Fetch top stories
    const stories = await getTopStories(userId, limit, sortBy);
    
    return NextResponse.json<ApiResponse<DashboardStory[]>>({
      success: true,
      data: stories,
    });
  } catch (error) {
    console.error("Error fetching top stories:", error);
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch top stories",
    }, { status: 500 });
  }
}
