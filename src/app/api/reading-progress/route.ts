import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Validation schema for updating reading progress
const updateProgressSchema = z.object({
  chapterId: z.string().min(1, "Chapter ID is required"),
  progress: z.number().min(0, "Progress must be at least 0").max(100, "Progress must be at most 100"),
});

// PUT endpoint to update reading progress
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProgressSchema.parse(body);

    // Find the chapter to ensure it exists
    const chapter = await prisma.chapter.findUnique({
      where: { id: validatedData.chapterId },
      include: { story: true },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Don't track reading progress for the author
    if (chapter.story.authorId === session.user.id) {
      return NextResponse.json({
        message: "Reading progress not tracked for the author",
      });
    }

    // Update or create reading progress
    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId: validatedData.chapterId,
        },
      },
      update: {
        progress: validatedData.progress,
        lastRead: new Date(),
      },
      create: {
        userId: session.user.id,
        chapterId: validatedData.chapterId,
        progress: validatedData.progress,
        lastRead: new Date(),
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating reading progress:", error);
    return NextResponse.json(
      { error: "Failed to update reading progress" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve reading progress for a user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get("chapterId");
    const storyId = searchParams.get("storyId");

    // Build query based on parameters
    const where: {
      userId: string;
      chapterId?: string;
      chapter?: {
        storyId: string;
      };
    } = {
      userId: session.user.id,
    };

    if (chapterId) {
      where.chapterId = chapterId;
    } else if (storyId) {
      where.chapter = {
        storyId,
      };
    }

    // Get reading progress with pagination and limit
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Limit to reasonable values
    const safeLimit = Math.min(limit, 50);

    // Get reading progress
    const progress = await prisma.readingProgress.findMany({
      where,
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            number: true,
            storyId: true,
            story: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastRead: "desc",
      },
      skip,
      take: safeLimit,
    });

    // Get total count for pagination
    const total = await prisma.readingProgress.count({ where });

    return NextResponse.json({
      data: progress,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    console.error("Error fetching reading progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch reading progress" },
      { status: 500 }
    );
  }
}
