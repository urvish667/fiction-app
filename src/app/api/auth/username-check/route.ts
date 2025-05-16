import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  // Apply rate limiting - 20 username checks per IP per minute
  const rateLimitResult = await rateLimit(request, {
    limit: 20,
    windowMs: 60 * 1000, // 1 minute
  });

  // If rate limit exceeded
  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({
        available: false,
        error: "Too many username check attempts. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          "Retry-After": Math.ceil((rateLimitResult.reset * 1000 - Date.now()) / 1000).toString(),
        },
      }
    );
  }

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
    return NextResponse.json(
      { available: false, error: "Error checking username availability" },
      { status: 500 }
    );
  }
}