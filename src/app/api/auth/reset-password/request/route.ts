import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import {
  generatePasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/auth/email-utils";
import { sanitizeText } from "@/lib/security/input-validation";
import { createErrorResponse, ErrorCode } from "@/lib/error-handling";
import { logError } from "@/lib/error-logger";

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return createErrorResponse(
        ErrorCode.INVALID_INPUT,
        "Email is required",
        400
      );
    }

    const sanitizedEmail = sanitizeText(email).toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return NextResponse.json({ success: true });
    }

    // Check if user is using OAuth (no password to reset)
    if (user.provider !== "credentials" || !user.password) {
      return createErrorResponse(
        ErrorCode.INVALID_INPUT,
        "This account uses social login and cannot reset password",
        400
      );
    }

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { identifier: sanitizedEmail },
    });

    // Generate new reset token
    const token = await generatePasswordResetToken(sanitizedEmail);

    // Send password reset email
    await sendPasswordResetEmail(sanitizedEmail, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error, { context: "Password reset request" });
    return createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "An error occurred while sending reset email",
      500
    );
  }
}

export const POST = handler;
