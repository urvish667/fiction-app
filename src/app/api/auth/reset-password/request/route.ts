import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { generatePasswordResetToken, sendPasswordResetEmail } from "@/lib/auth/email-utils";

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

    // Check if user is using OAuth (no password to reset)
    if (user.provider !== "credentials" || !user.password) {
      return NextResponse.json(
        { error: "This account uses social login and cannot reset password" },
        { status: 400 }
      );
    }

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { identifier: email },
    });

    // Generate new reset token
    const token = await generatePasswordResetToken(email);

    // Send password reset email
    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while sending reset email" },
      { status: 500 }
    );
  }
}
