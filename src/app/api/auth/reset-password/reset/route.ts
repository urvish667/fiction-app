import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { hashPassword } from "@/lib/auth/auth-utils";
import { sanitizeText } from "@/lib/security/input-validation";
import { createErrorResponse, ErrorCode } from "@/lib/error-handling";
import { logError } from "@/lib/error-logger";

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return createErrorResponse(
        ErrorCode.INVALID_INPUT,
        "Token and password are required",
        400
      );
    }

    if (password.length < 8) {
      return createErrorResponse(
        ErrorCode.INVALID_INPUT,
        "Password must be at least 8 characters",
        400
      );
    }

    const sanitizedToken = sanitizeText(token);

    // Find reset token in database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: sanitizedToken },
    });

    if (!resetToken) {
      return createErrorResponse(
        ErrorCode.INVALID_TOKEN,
        "Invalid reset token",
        400
      );
    }

    // Check if token is expired
    if (new Date() > new Date(resetToken.expires)) {
      return createErrorResponse(
        ErrorCode.TOKEN_EXPIRED,
        "Reset token has expired",
        400
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user's password
    await prisma.user.update({
      where: { email: resetToken.identifier },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await prisma.passwordResetToken.delete({
      where: { token: sanitizedToken },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error, { context: "Password reset" });
    return createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "An error occurred during password reset",
      500
    );
  }
}

export const POST = handler;
