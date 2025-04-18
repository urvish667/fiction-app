import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardOverviewData } from "@/lib/services/dashboard-service";
import { ApiResponse, DashboardOverviewData } from "@/types/dashboard";

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

    // Fetch dashboard data with the specified time range
    const dashboardData = await getDashboardOverviewData(userId, timeRange);

    return NextResponse.json<ApiResponse<DashboardOverviewData>>({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error fetching dashboard overview data:", error);

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch dashboard data",
    }, { status: 500 });
  }
}
