import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEngagementChartData } from "@/lib/services/dashboard-service";
import { ApiResponse, EngagementDataPoint } from "@/types/dashboard";

/**
 * GET /api/dashboard/charts/engagement
 * Fetches engagement chart data for the dashboard
 * @param timeRange - The time range for the chart data
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

    // Fetch engagement chart data
    const chartData = await getEngagementChartData(userId, timeRange);
    
    return NextResponse.json<ApiResponse<EngagementDataPoint[]>>({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error("Error fetching engagement chart data:", error);
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch engagement chart data",
    }, { status: 500 });
  }
}
