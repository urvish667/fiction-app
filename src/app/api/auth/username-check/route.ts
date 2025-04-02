import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { available: false, error: "Username is required" },
        { status: 400 }
      );
    }

    // Check if username meets requirements
    if (username.length < 3) {
      return NextResponse.json(
        { available: false, error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { available: false, error: "Username can only contain letters, numbers, underscores, and hyphens" },
        { status: 400 }
      );
    }

    // Check if username exists in database
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    return NextResponse.json({
      available: !existingUser,
      error: existingUser ? "Username is already taken" : null,
    });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json(
      { available: false, error: "Error checking username availability" },
      { status: 500 }
    );
  }
} 