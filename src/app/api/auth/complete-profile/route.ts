import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13;
  }, "You must be at least 13 years old"),
  pronoun: z.string(),
  termsAccepted: z.boolean().refine((val: boolean) => val === true, "You must accept the terms and conditions"),
});

export async function POST(request: NextRequest) {
  try {
    console.log("Profile completion request received");
    
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error("Unauthorized profile completion attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log(`Processing profile completion for user ID: ${session.user.id}`);
    
    // Parse and validate request
    const body = await request.json();
    console.log("Profile completion data:", body);
    
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
        console.log(`Username '${validatedData.username}' is already taken`);
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
      
      console.log(`Profile completed successfully for user ID: ${session.user.id}`);
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
        
        console.log("Validation errors:", fieldErrors);
        return NextResponse.json(
          { error: "Validation error", fields: fieldErrors },
          { status: 400 }
        );
      }
      
      throw validationError; // Re-throw if it's not a ZodError
    }
    
  } catch (error) {
    console.error("Profile completion error:", error);
    return NextResponse.json(
      { error: "An error occurred while completing your profile" },
      { status: 500 }
    );
  }
} 