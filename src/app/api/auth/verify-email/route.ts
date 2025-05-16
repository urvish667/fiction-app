import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { sendWelcomeEmail } from "@/lib/auth/email-utils";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  // Apply rate limiting - 10 verification attempts per IP per hour
  const rateLimitResult = await rateLimit(request, {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  });

  // If rate limit exceeded
  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many verification attempts",
        message: "Please try again later.",
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
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find verification token in database
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > new Date(verificationToken.expires)) {
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      );
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Send welcome email
    await sendWelcomeEmail(verificationToken.identifier);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 }
    );
  }
}
