import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/auth/db-adapter"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { hashPassword, verifyPassword } from "@/lib/auth/auth-utils"

// Validation schema for password change
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirm password must match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = passwordChangeSchema.parse(body)

    // Get the user with password
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

    // Check if user signed up with credentials
    if (user.provider !== "credentials" || !user.password) {
      return NextResponse.json(
        { error: "Password change is only available for users who signed up with email and password" },
        { status: 400 }
      )
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(
      validatedData.currentPassword,
      user.password
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Check if new password is different from current password
    const isSamePassword = await verifyPassword(
      validatedData.newPassword,
      user.password
    )

    if (isSamePassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.newPassword)

    // Update user password
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Password updated successfully" })

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
      { error: "An error occurred while changing password" },
      { status: 500 }
    )
  }
}
