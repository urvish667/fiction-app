import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logger } from "@/lib/logger";

// Validation schema
const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  birthdate: z.string().refine((date: string) => {
    const birthDate = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 13 && age <= 100;
  }, "You must be between 13 and 100 years old"),
  pronoun: z.string(),
  termsAccepted: z.boolean().refine((val: boolean) => val === true, "You must accept the terms and conditions"),
});

export async function POST(request: NextRequest) {
  try {
    logger.info("Profile completion request received");

    // Get the session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.error("Unauthorized profile completion attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info(`Processing profile completion for user ID: ${session.user.id}`);

    // Parse and validate request
    const body = await request.json();

    try {
      // Validate the data
      const validatedData = profileSchema.parse(body);

      // Check username availability
      const existingUser = await prisma.user.findUnique({
        where: {
          username: validatedData.username,
          NOT: {
            id: session.user.id
          }
        },
      });

      if (existingUser) {
        logger.info(`Username '${validatedData.username}' is already taken`);
        return NextResponse.json(
          { fields: { username: "Username is already taken" } },
          { status: 400 }
        );
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          username: validatedData.username,
          birthdate: new Date(validatedData.birthdate),
          pronoun: validatedData.pronoun,
          termsAccepted: validatedData.termsAccepted,
          isProfileComplete: true,
          updatedAt: new Date(),
        },
      });

      logger.info(`Profile completed successfully for user ID: ${session.user.id}`);
      return NextResponse.json({
        success: true,
        user: {
          username: updatedUser.username,
          birthdate: updatedUser.birthdate,
          pronoun: updatedUser.pronoun,
          isProfileComplete: updatedUser.isProfileComplete
        }
      });

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        validationError.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            const field = String(err.path[0]);
            fieldErrors[field] = err.message;
          }
        });

        logger.warn("Validation errors:", fieldErrors);
        return NextResponse.json(
          { error: "Validation error", fields: fieldErrors },
          { status: 400 }
        );
      }

      throw validationError; // Re-throw if it's not a ZodError
    }

  } catch (error) {
    logger.error("Profile completion error:", error);
    return NextResponse.json(
      { error: "An error occurred while completing your profile" },
      { status: 500 }
    );
  }
}
