import { NextRequest, NextResponse } from "next/server";
import { isUsernameAvailable } from "@/lib/auth/auth-utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username parameter is required" },
      { status: 400 }
    );
  }

  // Validate username format
  if (username.length < 3) {
    return NextResponse.json(
      { 
        available: false,
        error: "Username must be at least 3 characters" 
      },
      { status: 200 }
    );
  }

  if (username.length > 30) {
    return NextResponse.json(
      { 
        available: false,
        error: "Username must be less than 30 characters" 
      },
      { status: 200 }
    );
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return NextResponse.json(
      { 
        available: false,
        error: "Username can only contain letters, numbers, underscores, and hyphens"
      },
      { status: 200 }
    );
  }

  // Check database for username availability
  const available = await isUsernameAvailable(username);

  return NextResponse.json(
    { 
      available,
      error: available ? null : "Username is already taken" 
    },
    { status: 200 }
  );
} 