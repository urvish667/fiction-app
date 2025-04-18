import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { countWords } from "@/lib/utils";
import { S3Service } from "@/lib/s3-service";
import { calculateStoryStatus, isStoryPublic } from "@/lib/story-helpers";
import { ViewService } from "@/services/view-service";

// Validation schema for updating a chapter
const updateChapterSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters").optional(),
  content: z.string().min(1, "Content is required").optional(),
  number: z.number().int().positive("Chapter number must be positive").optional(),
  isPremium: z.boolean().optional(),
  status: z.enum(['draft', 'scheduled', 'published']).optional(),
  publishDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date(),
    z.null()
  ]).optional(),
});

// GET endpoint to retrieve a specific chapter
export async function GET(
  request: NextRequest,
  context: { params: { id: string; chapterId: string } }
) {
  const params = await context.params;
  try {
    const storyId = params.id;
    const chapterId = params.chapterId;
    const session = await getServerSession(authOptions);

    // Find the story to check permissions
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Get chapters to determine story status
    const storyChapters = await prisma.chapter.findMany({
      where: { storyId: story.id },
      select: { status: true }
    });

    // Calculate story status
    const storyStatus = calculateStoryStatus(storyChapters as any);

    // Check if the story is a draft and the user is not the author
    if (storyStatus === "draft" && (!session?.user?.id || session.user.id !== story.authorId)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the chapter
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        storyId,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Check if the chapter is premium and the user is not the author
    if (chapter.isPremium && (!session?.user?.id || session.user.id !== story.authorId)) {
      // TODO: Implement premium access check
      // For now, just return a basic version without content
      return NextResponse.json({
        ...chapter,
        content: "This is premium content. Please upgrade to access.",
        isPremium: true,
      });
    }

    // Get user's reading progress if logged in
    let readingProgress = null;
    if (session?.user?.id) {
      readingProgress = await prisma.readingProgress.findUnique({
        where: {
          userId_chapterId: {
            userId: session.user.id,
            chapterId: chapter.id,
          },
        },
      });

      // If no reading progress exists, create one with 0 progress
      if (!readingProgress && session.user.id !== story.authorId) {
        readingProgress = await prisma.readingProgress.create({
          data: {
            userId: session.user.id,
            chapterId: chapter.id,
            progress: 0,
          },
        });
      }
    }

    // Track view if not the author
    if (session?.user?.id !== story.authorId) {
      // Get client IP and user agent for anonymous tracking
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      const userAgent = request.headers.get('user-agent');

      // Track the chapter view and automatically track story view
      await ViewService.trackChapterView(
        chapter.id,
        session?.user?.id,
        { ip: clientIp || undefined, userAgent: userAgent || undefined },
        true // Also track a view for the story
      );
    }

    // Fetch content from S3
    let content;
    try {
      content = await S3Service.getContent(chapter.contentKey);
    } catch (error) {
      console.error("Error fetching content from S3:", error);
      content = "Content could not be loaded.";
    }

    // Return chapter with reading progress and content
    return NextResponse.json({
      ...chapter,
      content,
      story: {
        id: story.id,
        title: story.title,
        slug: story.slug,
        author: story.author,
      },
      readingProgress: readingProgress?.progress || 0,
    });
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a chapter
export async function PUT(
  request: NextRequest,
  context: { params: { id: string; chapterId: string } }
) {
  const params = await context.params;
  try {
    const storyId = params.id;
    const chapterId = params.chapterId;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Check if the user is the author
    if (story.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only edit chapters of your own stories" },
        { status: 403 }
      );
    }

    // Find the chapter
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        storyId,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateChapterSchema.parse(body);

    // Check if new chapter number already exists (if changing)
    if (validatedData.number && validatedData.number !== chapter.number) {
      const existingChapter = await prisma.chapter.findUnique({
        where: {
          storyId_number: {
            storyId,
            number: validatedData.number,
          },
        },
      });

      if (existingChapter) {
        return NextResponse.json(
          { error: `Chapter ${validatedData.number} already exists` },
          { status: 400 }
        );
      }
    }

    // Calculate word count if content is updated
    let wordCountDiff = 0;
    let dataToUpdate = { ...validatedData };

    if (validatedData.content) {
      const newWordCount = countWords(validatedData.content);
      wordCountDiff = newWordCount - chapter.wordCount;

      // Update content in S3
      await S3Service.uploadContent(chapter.contentKey, validatedData.content);

      // Remove content from data as it's not stored in DB
      const { content, ...dataForDb } = validatedData;
      dataToUpdate = {
        ...dataForDb,
        wordCount: newWordCount
      };
    }

    // Update the chapter in the database
    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: dataToUpdate,
    });

    // Add content to the response
    let content;
    try {
      // Use the original content from validatedData if it exists
      content = validatedData.content || await S3Service.getContent(chapter.contentKey);
    } catch (error) {
      console.error("Error fetching content from S3:", error);
      content = "Content could not be loaded.";
    }

    const chapterWithContent = {
      ...updatedChapter,
      content
    };

    // Update story word count if needed
    if (wordCountDiff !== 0) {
      await prisma.story.update({
        where: { id: storyId },
        data: {
          wordCount: {
            increment: wordCountDiff,
          },
        },
      });
    }

    // If the chapter's status has changed, recalculate and update the story status
    if (validatedData.status !== undefined) {
      // Get all chapters for this story
      const storyChapters = await prisma.chapter.findMany({
        where: { storyId },
        select: {
          status: true
        }
      });

      // Calculate the new story status
      const newStoryStatus = calculateStoryStatus(storyChapters as any);

      // Update the story status if it's different from the current status
      if (newStoryStatus !== story.status) {
        await prisma.story.update({
          where: { id: storyId },
          data: { status: newStoryStatus }
        });
      }
    }

    return NextResponse.json(chapterWithContent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating chapter:", error);
    return NextResponse.json(
      { error: "Failed to update chapter" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a chapter
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string; chapterId: string } }
) {
  const params = await context.params;
  try {
    const storyId = params.id;
    const chapterId = params.chapterId;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Check if the user is the author
    if (story.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only delete chapters of your own stories" },
        { status: 403 }
      );
    }

    // Find the chapter
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        storyId,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Delete content from S3
    try {
      await S3Service.deleteContent(chapter.contentKey);
    } catch (error) {
      console.error("Error deleting content from S3:", error);
      // Continue with chapter deletion even if S3 deletion fails
    }

    // Delete the chapter from database
    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    // Update story word count
    await prisma.story.update({
      where: { id: storyId },
      data: {
        wordCount: {
          decrement: chapter.wordCount,
        },
      },
    });

    // Recalculate and update the story status after chapter deletion
    const remainingChapters = await prisma.chapter.findMany({
      where: { storyId },
      select: { status: true }
    });

    // Calculate the new story status
    const newStoryStatus = calculateStoryStatus(remainingChapters as any);

    // Update the story status if it's different from the current status
    if (newStoryStatus !== story.status) {
      await prisma.story.update({
        where: { id: storyId },
        data: { status: newStoryStatus }
      });
    }

    return NextResponse.json(
      { message: "Chapter deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return NextResponse.json(
      { error: "Failed to delete chapter" },
      { status: 500 }
    );
  }
}
