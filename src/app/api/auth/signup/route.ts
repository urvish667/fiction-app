import { NextRequest, NextResponse } from "next/server";
import { createUser, isEmailAvailable, isUsernameAvailable } from "@/lib/auth/auth-utils";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/auth/email-utils";
import { ZodError, z } from "zod";
import { rateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/input-validation";

// Signup request validation schema
const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  birthdate: z.string().refine((date: string) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13;
  }, "You must be at least 13 years old"),
  pronoun: z.string(),
  termsAccepted: z.boolean().refine((val: boolean) => val === true, "You must accept the terms and conditions"),
  marketingOptIn: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  // Apply rate limiting - 5 signup attempts per IP per hour
  const rateLimitResult = await rateLimit(request, {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  });

  // If rate limit exceeded
  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many signup attempts",
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
    // Parse the request body
    const body = await request.json();

    // Sanitize inputs before validation
    const sanitizedBody = {
      ...body,
      email: body.email ? sanitizeText(body.email.trim().toLowerCase()) : body.email,
      username: body.username ? sanitizeText(body.username.trim()) : body.username,
      // Password is not sanitized as it will be hashed
      pronoun: body.pronoun ? sanitizeText(body.pronoun.trim()) : body.pronoun,
    };

    // Validate the sanitized data
    const validatedData = signupSchema.parse(sanitizedBody);

    // Check if email is available (for email signup)
    if (validatedData.email) {
      const emailAvailable = await isEmailAvailable(validatedData.email);
      if (!emailAvailable) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 400 }
        );
      }
    }

    // Check if username is available
    const usernameAvailable = await isUsernameAvailable(validatedData.username);
    if (!usernameAvailable) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Create user with emailVerified set to null (unverified)
    const user = await createUser({
      email: validatedData.email,
      username: validatedData.username,
      password: validatedData.password,
      birthdate: new Date(validatedData.birthdate),
      pronoun: validatedData.pronoun,
      termsAccepted: validatedData.termsAccepted,
      marketingOptIn: validatedData.marketingOptIn || false,
      emailVerified: null, // Mark as unverified
    });

    // Generate verification token
    const verificationToken = await generateVerificationToken(validatedData.email);

    // Send verification email
    await sendVerificationEmail(validatedData.email, verificationToken);

    return NextResponse.json(
      {
        message: "User created successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors = {} as Record<string, string>;

      error.issues.forEach((err) => {
        if (err.path && err.path.length > 0) {
          const field = String(err.path[0]); // Convert to string to ensure it's a valid key
          fieldErrors[field] = err.message;
        }
      });

      return NextResponse.json(
        { error: "Validation error", fields: fieldErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}