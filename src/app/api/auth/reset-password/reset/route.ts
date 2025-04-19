import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { hashPassword } from "@/lib/auth/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find reset token in database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > new Date(resetToken.expires)) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
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
      where: { token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An error occurred during password reset" },
      { status: 500 }
    );
  }
}
