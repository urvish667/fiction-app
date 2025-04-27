import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/auth/db-adapter"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { verifyPassword } from "@/lib/auth/auth-utils"

// Validation schema for account deletion
// For credentials users, we require password confirmation
// For OAuth users, we just require confirmation
const deleteAccountSchema = z.object({
  password: z.string().optional(),
  confirmation: z.literal(true, {
    errorMap: () => ({ message: "You must confirm this action" }),
  }),
})

export async function DELETE(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = deleteAccountSchema.parse(body)

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        provider: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // For credentials users, verify password
    if (user.provider === "credentials" && user.password) {
      // Password is required for credentials users
      if (!validatedData.password) {
        return NextResponse.json(
          { error: "Password is required to delete your account" },
          { status: 400 }
        )
      }

      // Verify password
      const isPasswordValid = await verifyPassword(
        validatedData.password,
        user.password
      )

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 400 }
        )
      }
    }

    // Delete user's sessions first
    await prisma.session.deleteMany({
      where: { userId: user.id },
    })

    // Delete user's accounts (OAuth connections)
    await prisma.account.deleteMany({
      where: { userId: user.id },
    })

    // Delete user's notifications
    await prisma.notification.deleteMany({
      where: { userId: user.id },
    })

    // Delete the user
    await prisma.user.delete({
      where: { id: user.id },
    })

    return NextResponse.json({ message: "Account deleted successfully" })

  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = {} as Record<string, string>

      error.errors.forEach((err) => {
        if (err.path && err.path.length > 0) {
          const field = String(err.path[0])
          fieldErrors[field] = err.message
        }
      })

      return NextResponse.json(
        { error: "Validation error", fields: fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "An error occurred while deleting your account" },
      { status: 500 }
    )
  }
}
