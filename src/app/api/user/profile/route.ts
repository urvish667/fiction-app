import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/auth/db-adapter"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Validation schema for social links
const socialLinksSchema = z.object({
  twitter: z.string().url().nullish(),
  instagram: z.string().url().nullish(),
  facebook: z.string().url().nullish(),
}).nullish()

// Validation schema for profile update
const profileUpdateSchema = z.object({
  name: z.string().max(50, "Name is too long").optional().nullable(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  location: z.string().max(100, "Location must be less than 100 characters").optional().nullable(),
  website: z.string().url("Please enter a valid URL").optional().nullable(),
  socialLinks: socialLinksSchema,
  language: z.enum(["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"]).optional().default("en"),
  theme: z.enum(["light", "dark", "system"]).optional().default("system"),
  marketingOptIn: z.boolean().optional(),
})

// GET method to retrieve user profile
export async function GET() {
  try {
    // Get the session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        location: true,
        website: true,
        socialLinks: true,
        language: true,
        theme: true,
        marketingOptIn: true,
        email: true,
        image: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error("Profile retrieval error:", error)
    return NextResponse.json(
      { error: "An error occurred while retrieving your profile" },
      { status: 500 }
    )
  }
}

// PATCH method to update user profile
export async function PATCH(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)

    // Check username availability if it's being changed
    if (validatedData.username) {
      const existingUser = await prisma.user.findUnique({
        where: {
          username: validatedData.username,
          NOT: { id: session.user.id }
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        username: validatedData.username,
        bio: validatedData.bio,
        location: validatedData.location,
        website: validatedData.website,
        socialLinks: validatedData.socialLinks ? { set: validatedData.socialLinks } : { set: null },
        language: validatedData.language,
        theme: validatedData.theme,
        marketingOptIn: validatedData.marketingOptIn !== undefined ? validatedData.marketingOptIn : undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        location: true,
        website: true,
        socialLinks: true,
        language: true,
        theme: true,
        marketingOptIn: true,
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error("Profile update error:", error)

    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      error.errors.forEach((err) => {
        if (err.path) {
          fieldErrors[err.path.join(".")] = err.message
        }
      })

      return NextResponse.json(
        { error: "Validation error", fields: fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "An error occurred while updating your profile" },
      { status: 500 }
    )
  }
}