import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/auth/db-adapter"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Validation schema for social links
const socialLinksSchema = z.object({
  twitter: z.union([z.literal(''), z.string().url()]).nullish(),
  instagram: z.union([z.literal(''), z.string().url()]).nullish(),
  facebook: z.union([z.literal(''), z.string().url()]).nullish(),
}).nullish()

// Validation schema for profile update
const profileUpdateSchema = z.object({
  name: z.string().max(50, "Name is too long").optional().nullable(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .optional(), // Make username optional for image updates
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  location: z.string().max(100, "Location must be less than 100 characters").optional().nullable(),
  website: z.union([z.literal(''), z.string().url("Please enter a valid URL")]).optional().nullable(),
  socialLinks: socialLinksSchema,
  language: z.enum(["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"]).optional().default("en"),
  theme: z.enum(["light", "dark", "system"]).optional().default("system"),
  marketingOptIn: z.boolean().optional(),
  image: z.string().optional().nullable(),
  bannerImage: z.string().optional().nullable(),
})

// GET method to retrieve user profile
export async function GET(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User ID is available from the session
    const userId = session.user.id;

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        bannerImage: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)

  } catch (error) {
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User ID is available from the session
    const userId = session.user.id;

    // Parse and validate request body
    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)

    // Check username availability if it's being changed
    if (validatedData.username) {
      const existingUser = await prisma.user.findUnique({
        where: {
          username: validatedData.username,
          NOT: { id: userId }
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        )
      }
    }

    // If only updating image or bannerImage, get the current user data
    if ((validatedData.image !== undefined || validatedData.bannerImage !== undefined) && !validatedData.username) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      })

      if (currentUser && currentUser.username) {
        validatedData.username = currentUser.username
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: validatedData.name,
        username: validatedData.username,
        bio: validatedData.bio,
        location: validatedData.location,
        website: validatedData.website,
        socialLinks: validatedData.socialLinks ? { set: validatedData.socialLinks } : undefined,
        language: validatedData.language,
        theme: validatedData.theme,
        marketingOptIn: validatedData.marketingOptIn !== undefined ? validatedData.marketingOptIn : undefined,
        image: validatedData.image !== undefined ? validatedData.image : undefined,
        bannerImage: validatedData.bannerImage !== undefined ? validatedData.bannerImage : undefined,
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
        image: true,
        bannerImage: true,
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
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