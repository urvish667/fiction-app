import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { sendWelcomeEmail } from "@/lib/auth/email-utils";

export async function GET(request: NextRequest) {
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
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 }
    );
  }
}
