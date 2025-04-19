import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/auth/email-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return NextResponse.json({ success: true });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Generate new verification token
    const token = await generateVerificationToken(email);

    // Send verification email
    await sendVerificationEmail(email, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "An error occurred while sending verification email" },
      { status: 500 }
    );
  }
}
