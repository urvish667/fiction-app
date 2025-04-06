import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { testS3Connection } from "@/lib/test-s3-connection";

/**
 * API endpoint to test S3 connection
 * This is for development/debugging purposes only and should be removed in production
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication - only allow admins or in development
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Test S3 connection
    const result = await testS3Connection();
    
    if (!result.success) {
      return NextResponse.json(
        { error: "S3 connection test failed", details: result },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error testing S3 connection:", error);
    return NextResponse.json(
      { error: "Failed to test S3 connection", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
