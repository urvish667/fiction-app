import { randomBytes } from "crypto";
import { prisma } from "./db-adapter";
import { sendEmail } from "../email/email-service";
import { getVerificationEmailTemplate, getPasswordResetEmailTemplate, getWelcomeEmailTemplate } from "../email/email-templates";

/**
 * Generate a verification token for email verification
 */
export async function generateVerificationToken(email: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

/**
 * Generate a password reset token
 */
export async function generatePasswordResetToken(email: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  // Log the verification URL in development
  if (process.env.NODE_ENV !== "production") {
    console.log(`Verification URL for ${email}: ${verificationUrl}`);
  }

  // Get user info if available
  const user = await prisma.user.findUnique({
    where: { email },
    select: { username: true }
  });

  // Get email template
  const template = getVerificationEmailTemplate({
    username: user?.username,
    verificationUrl
  });

  // Send the email
  const result = await sendEmail({
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html
  });

  return result.success;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password/${token}`;

  // Log the reset URL in development
  if (process.env.NODE_ENV !== "production") {
    console.log(`Password reset URL for ${email}: ${resetUrl}`);
  }

  // Get user info if available
  const user = await prisma.user.findUnique({
    where: { email },
    select: { username: true }
  });

  // Get email template
  const template = getPasswordResetEmailTemplate({
    username: user?.username,
    resetUrl
  });

  // Send the email
  const result = await sendEmail({
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html
  });

  return result.success;
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(email: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const loginUrl = `${baseUrl}/login`;

  // Get user info if available
  const user = await prisma.user.findUnique({
    where: { email },
    select: { username: true }
  });

  // Get email template
  const template = getWelcomeEmailTemplate({
    username: user?.username,
    loginUrl
  });

  // Send the email
  const result = await sendEmail({
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html
  });

  return result.success;
}