import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod"
import { profileUpdateSchema } from "@/lib/validators/profile"

// GET method to retrieve user profile
export async function GET() {
  try {
    // Get the session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // User ID is available from the session
    const userId = session.user.id

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
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch {
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

    // User ID is available from the session
    const userId = session.user.id

    // Parse and validate request body
    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)

    // Check username availability if it's being changed
    if (validatedData.username) {
      const existingUser = await prisma.user.findUnique({
        where: {
          username: validatedData.username,
          NOT: { id: userId },
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
    if (
      (validatedData.image !== undefined ||
        validatedData.bannerImage !== undefined) &&
      !validatedData.username
    ) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
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
        socialLinks: validatedData.socialLinks
          ? { set: validatedData.socialLinks }
          : undefined,
        language: validatedData.language,
        theme: validatedData.theme,
        marketingOptIn:
          validatedData.marketingOptIn !== undefined
            ? validatedData.marketingOptIn
            : undefined,
        image:
          validatedData.image !== undefined ? validatedData.image : undefined,
        bannerImage:
          validatedData.bannerImage !== undefined
            ? validatedData.bannerImage
            : undefined,
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
      },
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
