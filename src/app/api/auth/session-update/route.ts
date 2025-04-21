import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/auth/db-adapter";

/**
 * POST endpoint to force a session update
 * This is used after email verification to update the JWT token
 *
 * Note: This endpoint is primarily for logged-in users to refresh their session.
 * For email verification, we handle the verification in the verify-email API endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the latest user data from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return success with emailVerified status - the session will be updated on the next request
    return NextResponse.json({
      success: true,
      emailVerified: user.emailVerified
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
