import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEarningsData } from "@/lib/services/dashboard-service";
import { ApiResponse } from "@/types/dashboard";

/**
 * GET /api/dashboard/earnings
 * Fetches earnings data for the dashboard
 * @param timeRange - The time range for the earnings data
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

    // Fetch earnings data
    const earningsData = await getEarningsData(userId, timeRange);

    return NextResponse.json<ApiResponse<{
      total: number;
      change: number;
      recentDonations: Array<{
        id: string;
        amount: number;
        donorName: string;
        date: string;
        storyTitle?: string;
      }>;
    }>>({
      success: true,
      data: earningsData,
    });
  } catch (error) {
    console.error("Error fetching earnings data:", error);

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch earnings data",
    }, { status: 500 });
  }
}
