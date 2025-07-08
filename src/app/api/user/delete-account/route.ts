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

    // Delete user's related data in the correct order to avoid foreign key constraints
    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // 1. Delete user's likes (stories and chapters)
      await tx.like.deleteMany({
        where: { userId: user.id },
      })

      // 2. Delete user's comment likes
      await tx.commentLike.deleteMany({
        where: { userId: user.id },
      })

      // 3. Delete user's bookmarks
      await tx.bookmark.deleteMany({
        where: { userId: user.id },
      })

      // 4. Delete user's reading progress
      await tx.readingProgress.deleteMany({
        where: { userId: user.id },
      })

      // 5. Delete follow relationships (both as follower and following)
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: user.id },
            { followingId: user.id }
          ]
        },
      })

      // 6. Delete user's comments (this will cascade delete comment likes due to schema)
      await tx.comment.deleteMany({
        where: { userId: user.id },
      })

      // 7. Handle stories - Delete user's stories (this will cascade delete related data)
      // Note: This is a destructive operation. Consider business requirements.
      await tx.story.deleteMany({
        where: { authorId: user.id },
      })

      // 8. Handle donations - Keep donation records for financial/legal compliance
      // but remove personal identifiers by setting user references to null
      // Note: This requires schema changes to make donorId and recipientId nullable
      // For now, we'll delete donations to avoid constraint issues
      await tx.donation.deleteMany({
        where: {
          OR: [
            { donorId: user.id },
            { recipientId: user.id }
          ]
        },
      })

      // 9. Delete user's sessions
      await tx.session.deleteMany({
        where: { userId: user.id },
      })

      // 10. Delete user's accounts (OAuth connections)
      await tx.account.deleteMany({
        where: { userId: user.id },
      })

      // 11. Delete user's notifications (both received and acted upon)
      await tx.notification.deleteMany({
        where: {
          OR: [
            { userId: user.id },
            { actorId: user.id }
          ]
        },
      })

      // 12. Finally, delete the user
      await tx.user.delete({
        where: { id: user.id },
      })
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

    // Log the error for debugging
    console.error("Account deletion error:", error)

    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          { error: "Cannot delete account due to existing data dependencies. Please contact support." },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: "An error occurred while deleting your account" },
      { status: 500 }
    )
  }
}
