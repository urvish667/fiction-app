import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserStories } from "@/lib/services/dashboard-service";
import { ApiResponse } from "@/types/dashboard";

/**
 * GET /api/dashboard/user-stories
 * Fetches all stories for the current user
 */
export async function GET() {
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

    // Fetch user stories
    const stories = await getUserStories(userId);
    
    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: stories,
    });
  } catch (error) {
    console.error("Error fetching user stories:", error);
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch user stories",
    }, { status: 500 });
  }
}
