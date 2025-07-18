import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { sanitizeText } from "@/lib/security/input-validation";
import { createErrorResponse, ErrorCode } from "@/lib/error-handling";
import { logError } from "@/lib/error-logger";

async function handler(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return createErrorResponse(
        ErrorCode.INVALID_INPUT,
        "Reset token is required",
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

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error, { context: "Password reset verification" });
    return createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "An error occurred during verification",
      500
    );
  }
}

export const GET = handler;
