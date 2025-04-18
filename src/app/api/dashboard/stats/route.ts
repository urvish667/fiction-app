import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/dashboard-service";
import { ApiResponse, DashboardStats } from "@/types/dashboard";

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

    // Fetch dashboard stats
    const stats = await getDashboardStats(userId, timeRange);
    
    return NextResponse.json<ApiResponse<DashboardStats>>({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch dashboard stats",
    }, { status: 500 });
  }
}
